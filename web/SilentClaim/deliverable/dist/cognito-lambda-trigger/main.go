package main

import (
	"context"
	"regexp"

	"github.com/aws/aws-lambda-go/lambda"
)

// handler receives the raw event as an arbitrary map (keeps it simple and flexible).
func handler(ctx context.Context, event map[string]interface{}) (map[string]interface{}, error) {
	// Safely drill down to event.request.clientMetadata
	var clientMetadata map[string]interface{}
	if reqIf, ok := event["request"]; ok {
		if req, ok := reqIf.(map[string]interface{}); ok {
			if cmIf, ok := req["clientMetadata"]; ok {
				switch cm := cmIf.(type) {
				case map[string]interface{}:
					clientMetadata = cm
				case map[string]string:
					// convert map[string]string -> map[string]interface{}
					clientMetadata = make(map[string]interface{}, len(cm))
					for k, v := range cm {
						clientMetadata[k] = v
					}
				}
			}
		}
	}

	// no clientMetadata or no role -> return unchanged
	if clientMetadata == nil {
		return event, nil
	}

	roleIf, ok := clientMetadata["role"]
	if !ok {
		return event, nil
	}

	roleStr, ok := roleIf.(string)
	if !ok {
		return event, nil
	}

	// Validate: lowercase alphanumeric only
	validRole := regexp.MustCompile(`^[a-zA-Z0-9_:]+$`)
	if !validRole.MatchString(roleStr) {
		// invalid role -> do not modify event
		return event, nil
	}

	// Ensure event.response exists
	resp, ok := event["response"].(map[string]interface{})
	if !ok || resp == nil {
		resp = make(map[string]interface{})
		event["response"] = resp
	}

	// Build claimsAndScopeOverrideDetails with role only at root
	claimsOverride := map[string]interface{}{
		"idTokenGeneration": map[string]interface{}{
			"claimsToAddOrOverride": map[string]interface{}{
				"role": roleStr,
			},
		},
		"accessTokenGeneration": map[string]interface{}{
			"claimsToAddOrOverride": map[string]interface{}{
				"role": roleStr,
			},
		},
	}

	resp["claimsAndScopeOverrideDetails"] = claimsOverride

	return event, nil
}

func main() {
	lambda.Start(handler)
}
