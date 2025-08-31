package main

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
)

var httpClient = &http.Client{Timeout: 3 * time.Second}

type userInfoAttr struct {
	Name  string `json:"Name"`
	Value string `json:"Value"`
}
type userInfoResp struct {
	Username       string         `json:"Username"`
	UserAttributes []userInfoAttr `json:"UserAttributes"`
}
type jwtResp struct {
	Methods []string `json:"methods"`
}

func handler(ctx context.Context, e events.APIGatewayCustomAuthorizerRequest) (events.APIGatewayCustomAuthorizerResponse, error) {
	fmt.Printf("DEBUG: Lambda authorizer invoked with event: %+v\n", e)

	apiBase := strings.TrimRight(os.Getenv("API_BASE_URL"), "/")
	if apiBase == "" {
		return unauthorized("missing API_BASE_URL"), nil
	}

	token := strings.TrimSpace(e.AuthorizationToken)
	if token == "" {
		return unauthorized("missing token"), nil
	}

	if strings.HasPrefix(strings.ToLower(token), "bearer ") {
		token = strings.TrimSpace(token[7:])
	}

	if token == "" {
		return unauthorized("empty token"), nil
	}

	baseArn, stage, verb, resourcePath, err := parseMethodARN(e.MethodArn)
	fmt.Printf("DEBUG: Parsed MethodArn - baseArn: %s, stage: %s, verb: %s, resourcePath: %s, err: %v\n", baseArn, stage, verb, resourcePath, err)
	if err != nil {
		return unauthorized("bad methodArn"), nil
	}

	// Get user id
	sub, err := fetchSub(ctx, apiBase, token)
	fmt.Printf("DEBUG: /userinfo response - sub: %s, err: %v\n", sub, err)
	if err != nil || sub == "" {
		return unauthorized("cannot resolve sub"), nil
	}

	// Get allowed methods
	allowed, err := fetchAllowedMethods(ctx, apiBase, token)
	fmt.Printf("DEBUG: /jwt response - allowed methods: %v, err: %v\n", allowed, err)
	if err != nil || len(allowed) == 0 {
		return unauthorized("no allowed methods"), nil
	}

	// Build resources list: same exact resource path, but for each allowed method
	resources := make([]string, 0, len(allowed))
	for _, m := range allowed {
		mu := strings.ToUpper(strings.TrimSpace(m))
		if mu == "" {
			continue
		}
		resource := fmt.Sprintf("%s/%s/%s/notes/%s/", baseArn, stage, mu, sub)
		resources = append(resources, resource)
	}

	policy := events.APIGatewayCustomAuthorizerResponse{
		PrincipalID: sub,
		PolicyDocument: events.APIGatewayCustomAuthorizerPolicy{
			Version: "2012-10-17",
			Statement: []events.IAMPolicyStatement{
				{
					Action:   []string{"execute-api:Invoke"},
					Effect:   "Allow",
					Resource: resources,
				},
			},
		},
		Context: map[string]interface{}{
			"userId": sub,
		},
	}

	fmt.Printf("DEBUG: Returning successful policy - PrincipalID: %s, Resources: %v\n", policy.PrincipalID, resources)
	return policy, nil
}

func fetchSub(ctx context.Context, base, token string) (string, error) {
	url := base + "/userinfo"
	fmt.Printf("DEBUG: Making request to: %s\n", url)

	req, _ := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Accept", "application/json")

	resp, err := httpClient.Do(req)
	if err != nil {
		fmt.Printf("DEBUG: HTTP request failed: %v\n", err)
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		return "", fmt.Errorf("userinfo status %d", resp.StatusCode)
	}

	var u userInfoResp
	if err := json.NewDecoder(resp.Body).Decode(&u); err != nil {
		return "", err
	}

	for _, a := range u.UserAttributes {
		if a.Name == "sub" && a.Value != "" {
			return a.Value, nil
		}
	}
	return "", errors.New("sub not found")
}

func fetchAllowedMethods(ctx context.Context, base, token string) ([]string, error) {
	url := base + "/jwt"

	req, _ := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Accept", "application/json")

	resp, err := httpClient.Do(req)
	if err != nil {
		fmt.Printf("DEBUG: HTTP request failed: %v\n", err)
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		return nil, fmt.Errorf("jwt status %d", resp.StatusCode)
	}

	var j jwtResp
	dec := json.NewDecoder(resp.Body)
	if err := dec.Decode(&j); err != nil {
		return nil, err
	}

	if len(j.Methods) == 0 {
		return nil, errors.New("no methods")
	}
	return j.Methods, nil
}

func parseMethodARN(methodArn string) (baseArn, stage, verb, resource string, err error) {
	slashSplit := strings.SplitN(methodArn, "/", 2)
	if len(slashSplit) != 2 {
		return "", "", "", "", errors.New("bad arn")
	}
	baseArn = slashSplit[0]
	rest := slashSplit[1]

	parts := strings.SplitN(rest, "/", 3)
	if len(parts) < 3 {
		return "", "", "", "", errors.New("bad arn parts")
	}
	stage = parts[0]
	verb = parts[1]
	resource = parts[2]

	return
}

func unauthorized(msg string) events.APIGatewayCustomAuthorizerResponse {
	fmt.Printf("DEBUG: Returning unauthorized response with message: %s\n", msg)
	return events.APIGatewayCustomAuthorizerResponse{
		PrincipalID: "unauthorized",
		PolicyDocument: events.APIGatewayCustomAuthorizerPolicy{
			Version: "2012-10-17",
			Statement: []events.IAMPolicyStatement{
				{
					Action:   []string{"execute-api:Invoke"},
					Effect:   "Deny",
					Resource: []string{"*"},
				},
			},
		},
		Context: map[string]interface{}{"reason": msg},
	}
}

func main() {
	lambda.Start(handler)
}
