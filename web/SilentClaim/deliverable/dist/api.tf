# API Definitions

resource "aws_dynamodb_table" "notes" {
  name         = "${var.project}-notes"
  billing_mode = "PAY_PER_REQUEST"

  hash_key = "user_id"

  attribute {
    name = "user_id"
    type = "S"
  }
}

data "aws_iam_policy_document" "apigw_assume" {
  statement {
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = ["apigateway.amazonaws.com"]
    }
    actions = ["sts:AssumeRole"]
  }
}

resource "aws_iam_role" "apigw_operations" {
  name               = "silentclaim-apigw-operations-role"
  assume_role_policy = data.aws_iam_policy_document.apigw_assume.json
}

data "aws_iam_policy_document" "apigw_dynamo_access" {
  statement {
    effect = "Allow"
    actions = [
      "dynamodb:PutItem",
      "dynamodb:GetItem"
    ]
    resources = [aws_dynamodb_table.notes.arn]
  }
}

resource "aws_iam_role_policy" "apigw_operations_dynamo" {
  role   = aws_iam_role.apigw_operations.id
  policy = data.aws_iam_policy_document.apigw_dynamo_access.json
}

resource "aws_iam_role" "lambda_authorizer" {
  name = "silentclaim-lambda-authorizer-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_authorizer_basic" {
  role       = aws_iam_role.lambda_authorizer.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "null_resource" "build_lambda_authorizer" {
  triggers = {
    build_hash = sha1(join("", [
      for f in fileset(var.lambda_authorizer_path, "**/*.go") : file("${var.lambda_authorizer_path}/${f}")
    ])),
    rebuild = var.rebuild_lambdas
  }

  provisioner "local-exec" {
    command = <<-EOT
      mkdir -p "${local.root_dir}/${var.lambda_authorizer_path}/build"
      rm -f "${local.root_dir}/${var.lambda_authorizer_path}/build/lambda-authorizer" || true
      rm -f "${local.root_dir}/${var.lambda_authorizer_path}/build/lambda-authorizer.zip" || true

      echo "Building Go lambda (linux/amd64)..."
      cd "${local.root_dir}/${var.lambda_authorizer_path}"
      GOOS=linux GOARCH=amd64 CGO_ENABLED=0 go build -ldflags="-s -w" -o "${local.root_dir}/${var.lambda_authorizer_path}/build/lambda-authorizer" .

      echo "Zipping binary..."
      (cd "${local.root_dir}/${var.lambda_authorizer_path}/build" && cp lambda-authorizer bootstrap && zip -j "lambda-authorizer.zip" "bootstrap")

      echo "Built lambda-authorizer.zip"
    EOT
  }
}

resource "aws_lambda_function" "authorizer" {
  filename         = "${local.root_dir}/${var.lambda_authorizer_path}/build/lambda-authorizer.zip"
  function_name    = "silentclaim-custom-authorizer"
  role             = aws_iam_role.lambda_authorizer.arn
  handler          = "bootstrap"
  runtime          = "provided.al2"
  timeout          = 30
  source_code_hash = null_resource.build_lambda_authorizer.triggers.build_hash

  environment {
    variables = {
      API_BASE_URL = "https://${aws_api_gateway_rest_api.notes.id}.execute-api.${var.aws_region}.amazonaws.com/${var.stage_name}"
    }
  }

  depends_on = [aws_api_gateway_rest_api.notes]
}

resource "aws_iam_role" "apigw_lambda_authorizer" {
  name = "silentclaim-apigw-lambda-authorizer-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "apigateway.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy" "apigw_lambda_authorizer" {
  name = "silentclaim-apigw-lambda-authorizer-policy"
  role = aws_iam_role.apigw_lambda_authorizer.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = "lambda:InvokeFunction"
        Resource = aws_lambda_function.authorizer.arn
      }
    ]
  })
}

resource "aws_api_gateway_rest_api" "notes" {
  name = "silentclaim-api"
  endpoint_configuration {
    types = ["REGIONAL"]
  }
}

resource "aws_api_gateway_authorizer" "custom" {
  name                             = "silentclaim-custom-authorizer"
  rest_api_id                      = aws_api_gateway_rest_api.notes.id
  type                             = "TOKEN"
  authorizer_uri                   = aws_lambda_function.authorizer.invoke_arn
  authorizer_credentials           = aws_iam_role.apigw_lambda_authorizer.arn
  identity_source                  = "method.request.header.Authorization"
  authorizer_result_ttl_in_seconds = 0
}

resource "aws_api_gateway_resource" "notes_root" {
  rest_api_id = aws_api_gateway_rest_api.notes.id
  parent_id   = aws_api_gateway_rest_api.notes.root_resource_id
  path_part   = "notes"
}

resource "aws_api_gateway_resource" "proxy" {
  rest_api_id = aws_api_gateway_rest_api.notes.id
  parent_id   = aws_api_gateway_resource.notes_root.id
  path_part   = "{proxy+}"
}

resource "aws_api_gateway_method" "get_note" {
  rest_api_id   = aws_api_gateway_rest_api.notes.id
  resource_id   = aws_api_gateway_resource.proxy.id
  http_method   = "GET"
  authorization = "CUSTOM"
  authorizer_id = aws_api_gateway_authorizer.custom.id
  request_parameters = {
    "method.request.path.proxy" = true
  }
}

resource "aws_api_gateway_integration" "get_note" {
  rest_api_id             = aws_api_gateway_rest_api.notes.id
  resource_id             = aws_api_gateway_resource.proxy.id
  http_method             = aws_api_gateway_method.get_note.http_method
  integration_http_method = "POST"
  type                    = "AWS"
  uri                     = "arn:aws:apigateway:${var.aws_region}:dynamodb:action/GetItem"
  credentials             = aws_iam_role.apigw_operations.arn

  request_templates = {
    "application/json" = <<VTL
#set($proxy = $input.params('proxy'))
#set($user_id = $proxy.split('/')[0])
{
  "TableName": "${aws_dynamodb_table.notes.name}",
  "Key": {
    "user_id": { "S": "$util.escapeJavaScript($user_id)" }
  }
}
VTL
  }

  request_parameters = {
    "integration.request.header.Content-Type" = "'application/x-amz-json-1.0'"
  }

  passthrough_behavior = "NEVER"
}

resource "aws_api_gateway_method_response" "get_note_200" {
  rest_api_id     = aws_api_gateway_rest_api.notes.id
  resource_id     = aws_api_gateway_resource.proxy.id
  http_method     = aws_api_gateway_method.get_note.http_method
  status_code     = "200"
  response_models = { "application/json" = "Empty" }
  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin"  = true
    "method.response.header.Access-Control-Allow-Headers" = true
  }
}

resource "aws_api_gateway_integration_response" "get_note_200" {
  rest_api_id = aws_api_gateway_rest_api.notes.id
  resource_id = aws_api_gateway_resource.proxy.id
  http_method = aws_api_gateway_method.get_note.http_method
  status_code = aws_api_gateway_method_response.get_note_200.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,Authorization'"
  }

  response_templates = {
    "application/json" = <<VTL
#set($item = $input.path('$.Item'))
#if($item.size() == 0)
  Error: Note not found
#else
  {
    "user_id": "$util.escapeJavaScript($item.user_id.S)",
    "content": "$util.escapeJavaScript($item.content.S)",
    "created_at": $item.created_at.N
  }
#end
VTL
  }

  depends_on = [aws_api_gateway_integration.get_note]
}

resource "aws_api_gateway_method" "post_note" {
  rest_api_id   = aws_api_gateway_rest_api.notes.id
  resource_id   = aws_api_gateway_resource.proxy.id
  http_method   = "POST"
  authorization = "CUSTOM"
  authorizer_id = aws_api_gateway_authorizer.custom.id

  request_parameters = {
    "method.request.header.Content-Type" = false
  }
}

resource "aws_api_gateway_integration" "post_note" {
  rest_api_id             = aws_api_gateway_rest_api.notes.id
  resource_id             = aws_api_gateway_resource.proxy.id
  http_method             = aws_api_gateway_method.post_note.http_method
  integration_http_method = "POST"
  type                    = "AWS"
  uri                     = "arn:aws:apigateway:${var.aws_region}:dynamodb:action/PutItem"
  credentials             = aws_iam_role.apigw_operations.arn

  request_templates = {
    "application/json" = <<VTL
{
  "TableName": "${aws_dynamodb_table.notes.name}",
  "Item": {
    "user_id":    { "S": "$context.authorizer.userId" },
    "content":    { "S": "$util.escapeJavaScript($input.path('$.content'))" },
    "created_at": { "N": "$context.requestTimeEpoch" }
  }
}
VTL
  }

  request_parameters = {
    "integration.request.header.Content-Type" = "'application/x-amz-json-1.0'"
  }

  passthrough_behavior = "NEVER"
  depends_on           = [aws_iam_role_policy.apigw_operations_dynamo]
}

resource "aws_api_gateway_method_response" "post_note_200" {
  rest_api_id = aws_api_gateway_rest_api.notes.id
  resource_id = aws_api_gateway_resource.proxy.id
  http_method = aws_api_gateway_method.post_note.http_method
  status_code = "200"

  response_models = { "application/json" = "Empty" }
  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin"  = true
    "method.response.header.Access-Control-Allow-Headers" = true
  }
}

resource "aws_api_gateway_integration_response" "post_note_200" {
  rest_api_id = aws_api_gateway_rest_api.notes.id
  resource_id = aws_api_gateway_resource.proxy.id
  http_method = aws_api_gateway_method.post_note.http_method
  status_code = aws_api_gateway_method_response.post_note_200.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,Authorization'"
  }

  response_templates = {
    "application/json" = <<VTL
{
  "user_id": "$context.authorizer.userId",
  "status": "created"
}
VTL
  }

  depends_on = [aws_api_gateway_integration.post_note]
}

resource "aws_api_gateway_method" "options_proxy" {
  rest_api_id   = aws_api_gateway_rest_api.notes.id
  resource_id   = aws_api_gateway_resource.proxy.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "options_proxy" {
  rest_api_id       = aws_api_gateway_rest_api.notes.id
  resource_id       = aws_api_gateway_resource.proxy.id
  http_method       = aws_api_gateway_method.options_proxy.http_method
  type              = "MOCK"
  request_templates = { "application/json" = "{ \"statusCode\": 200 }" }
}

resource "aws_api_gateway_method_response" "options_proxy_200" {
  rest_api_id = aws_api_gateway_rest_api.notes.id
  resource_id = aws_api_gateway_resource.proxy.id
  http_method = aws_api_gateway_method.options_proxy.http_method
  status_code = "200"
  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin"  = true
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
  }
}

resource "aws_api_gateway_integration_response" "options_proxy_200" {
  rest_api_id = aws_api_gateway_rest_api.notes.id
  resource_id = aws_api_gateway_resource.proxy.id
  http_method = aws_api_gateway_method.options_proxy.http_method
  status_code = aws_api_gateway_method_response.options_proxy_200.status_code
  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,Authorization'"
    "method.response.header.Access-Control-Allow-Methods" = "'OPTIONS,GET,POST'"
  }
  response_templates = { "application/json" = "" }

  depends_on = [aws_api_gateway_integration.options_proxy]
}

resource "aws_api_gateway_deployment" "deploy" {
  rest_api_id = aws_api_gateway_rest_api.notes.id

  depends_on = [
    aws_api_gateway_integration.post_note,
    aws_api_gateway_integration.get_note,
    aws_api_gateway_integration.get_userinfo,
    aws_api_gateway_integration.get_jwt,
    aws_api_gateway_integration.options_proxy,
    aws_api_gateway_integration.options_userinfo,
    aws_api_gateway_integration.options_jwt
  ]

  triggers = {
    redeployment = sha1(join(",", [
      aws_api_gateway_integration.post_note.id,
      aws_api_gateway_integration.get_note.id,
      aws_api_gateway_integration.get_userinfo.id,
      aws_api_gateway_integration.get_jwt.id,
      aws_api_gateway_integration.options_proxy.id,
      aws_api_gateway_integration.options_userinfo.id,
      aws_api_gateway_integration.options_jwt.id
    ]))
  }

  lifecycle { create_before_destroy = true }
}

locals {
  notes_table_name = aws_dynamodb_table.notes.name
}

resource "aws_api_gateway_stage" "stage" {
  rest_api_id   = aws_api_gateway_rest_api.notes.id
  stage_name    = var.stage_name
  deployment_id = aws_api_gateway_deployment.deploy.id

  variables = {
    notes_table = local.notes_table_name
  }

  cache_cluster_enabled = true
  cache_cluster_size    = "0.5"
}

data "aws_iam_policy_document" "apigw_cognito_access" {
  statement {
    effect    = "Allow"
    actions   = ["cognito-idp:GetUser"]
    resources = ["*"]
  }
}

resource "aws_iam_role_policy" "apigw_cognito_access" {
  role   = aws_iam_role.apigw_operations.id
  policy = data.aws_iam_policy_document.apigw_cognito_access.json
}

resource "aws_api_gateway_resource" "userinfo" {
  rest_api_id = aws_api_gateway_rest_api.notes.id
  parent_id   = aws_api_gateway_rest_api.notes.root_resource_id
  path_part   = "userinfo"
}

resource "aws_api_gateway_method" "get_userinfo" {
  rest_api_id   = aws_api_gateway_rest_api.notes.id
  resource_id   = aws_api_gateway_resource.userinfo.id
  http_method   = "GET"
  authorization = "NONE"
  request_parameters = {
    "method.request.header.Authorization" = true
  }
}

resource "aws_api_gateway_integration" "get_userinfo" {
  rest_api_id             = aws_api_gateway_rest_api.notes.id
  resource_id             = aws_api_gateway_resource.userinfo.id
  http_method             = aws_api_gateway_method.get_userinfo.http_method
  integration_http_method = "POST"
  type                    = "AWS"
  uri                     = "arn:aws:apigateway:${var.aws_region}:cognito-idp:path//"
  credentials             = aws_iam_role.apigw_operations.arn

  request_parameters = {
    "integration.request.header.Content-Type" = "'application/x-amz-json-1.1'"
    "integration.request.header.X-Amz-Target" = "'AWSCognitoIdentityProviderService.GetUser'"
  }

  cache_key_parameters = [
    "method.request.header.Authorization"
  ]

  request_templates = {
    "application/json" = <<VTL
#set($auth = $input.params().header.get('Authorization'))
#set($token = $auth)
#if($token && $token.toLowerCase().startsWith("bearer "))
  #set($token = $token.substring(7))
#end
{
  "AccessToken": "$util.escapeJavaScript($token)"
}
VTL
  }

  depends_on = [aws_iam_role_policy.apigw_cognito_access]
}

resource "aws_api_gateway_method_response" "get_userinfo_200" {
  rest_api_id     = aws_api_gateway_rest_api.notes.id
  resource_id     = aws_api_gateway_resource.userinfo.id
  http_method     = aws_api_gateway_method.get_userinfo.http_method
  status_code     = "200"
  response_models = { "application/json" = "Empty" }
  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin"  = true
    "method.response.header.Access-Control-Allow-Headers" = true
  }
}

resource "aws_api_gateway_integration_response" "get_userinfo_200" {
  rest_api_id = aws_api_gateway_rest_api.notes.id
  resource_id = aws_api_gateway_resource.userinfo.id
  http_method = aws_api_gateway_method.get_userinfo.http_method
  status_code = aws_api_gateway_method_response.get_userinfo_200.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,Authorization'"
  }

  response_templates = { "application/json" = "$input.body" }

  depends_on = [aws_api_gateway_integration.get_userinfo]
}

resource "aws_api_gateway_method" "options_userinfo" {
  rest_api_id   = aws_api_gateway_rest_api.notes.id
  resource_id   = aws_api_gateway_resource.userinfo.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "options_userinfo" {
  rest_api_id       = aws_api_gateway_rest_api.notes.id
  resource_id       = aws_api_gateway_resource.userinfo.id
  http_method       = aws_api_gateway_method.options_userinfo.http_method
  type              = "MOCK"
  request_templates = { "application/json" = "{ \"statusCode\": 200 }" }
}

resource "aws_api_gateway_method_response" "options_userinfo_200" {
  rest_api_id = aws_api_gateway_rest_api.notes.id
  resource_id = aws_api_gateway_resource.userinfo.id
  http_method = aws_api_gateway_method.options_userinfo.http_method
  status_code = "200"
  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin"  = true
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
  }
}

resource "aws_api_gateway_integration_response" "options_userinfo_200" {
  rest_api_id = aws_api_gateway_rest_api.notes.id
  resource_id = aws_api_gateway_resource.userinfo.id
  http_method = aws_api_gateway_method.options_userinfo.http_method
  status_code = aws_api_gateway_method_response.options_userinfo_200.status_code
  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,Authorization'"
    "method.response.header.Access-Control-Allow-Methods" = "'OPTIONS,GET'"
  }
  response_templates = { "application/json" = "" }

  depends_on = [aws_api_gateway_integration.options_userinfo]
}

resource "aws_api_gateway_resource" "jwt" {
  rest_api_id = aws_api_gateway_rest_api.notes.id
  parent_id   = aws_api_gateway_rest_api.notes.root_resource_id
  path_part   = "jwt"
}

resource "aws_api_gateway_method" "get_jwt" {
  rest_api_id   = aws_api_gateway_rest_api.notes.id
  resource_id   = aws_api_gateway_resource.jwt.id
  http_method   = "GET"
  authorization = "NONE"
  request_parameters = {
    "method.request.header.Authorization" = true
  }
}

resource "aws_api_gateway_integration" "get_jwt" {
  rest_api_id = aws_api_gateway_rest_api.notes.id
  resource_id = aws_api_gateway_resource.jwt.id
  http_method = aws_api_gateway_method.get_jwt.http_method
  type        = "MOCK"
  request_templates = {
    "application/json" = "{ \"statusCode\": 200 }"
  }

  cache_key_parameters = [
    "method.request.header.Authorization"
  ]
}

resource "aws_api_gateway_method_response" "get_jwt_200" {
  rest_api_id     = aws_api_gateway_rest_api.notes.id
  resource_id     = aws_api_gateway_resource.jwt.id
  http_method     = aws_api_gateway_method.get_jwt.http_method
  status_code     = "200"
  response_models = { "application/json" = "Empty" }
  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin"  = true
    "method.response.header.Access-Control-Allow-Headers" = true
  }
}

resource "aws_api_gateway_integration_response" "get_jwt_200" {
  rest_api_id = aws_api_gateway_rest_api.notes.id
  resource_id = aws_api_gateway_resource.jwt.id
  http_method = aws_api_gateway_method.get_jwt.http_method
  status_code = aws_api_gateway_method_response.get_jwt_200.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,Authorization'"
  }

  response_templates = {
    "application/json" = <<VTL
#set($auth = $input.params().header.get('Authorization'))
#if(!$auth) #set($auth = $input.params().header.get('authorization')) #end
#set($token = $auth)
#if($token) #set($token = $token.trim()) #end
#if($token && $token.toLowerCase().startsWith("bearer "))
  #set($token = $token.substring(7))
#end

#if(!$token || $token.length() == 0)
  Error: Missing authorization
#else
  #set($parts = $token.split('\.'))
  #if($parts.size() < 2)
    Error: Invalid token format
  #else
    #set($b64 = $parts[1].replace('-', '+').replace('_', '/'))
    #set($rem = $b64.length() % 4)
    #if($rem == 2)
      #set($b64 = $b64 + '==')
    #elseif($rem == 3)
      #set($b64 = $b64 + '=')
    #elseif($rem == 1)
      #set($b64 = $b64 + '===')
    #end
    #set($json = $util.base64Decode($b64))
    #set($claims = $util.parseJson($json))
    #set($role = $claims.role)
    #if(!$role)
      Error: Missing role
    #else
      #set($roleLower = $role.toString().toLowerCase())
      #if($roleLower == "writer")
        { "methods": ["GET","POST"] }
      #elseif($roleLower == "reader")
        { "methods": ["GET"] }
      #else
        $roleLower is not a valid role
      #end
    #end
  #end
#end
VTL
  }

  depends_on = [aws_api_gateway_integration.get_jwt]
}

resource "aws_api_gateway_method" "options_jwt" {
  rest_api_id   = aws_api_gateway_rest_api.notes.id
  resource_id   = aws_api_gateway_resource.jwt.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "options_jwt" {
  rest_api_id       = aws_api_gateway_rest_api.notes.id
  resource_id       = aws_api_gateway_resource.jwt.id
  http_method       = aws_api_gateway_method.options_jwt.http_method
  type              = "MOCK"
  request_templates = { "application/json" = "{ \"statusCode\": 200 }" }
}

resource "aws_api_gateway_method_response" "options_jwt_200" {
  rest_api_id = aws_api_gateway_rest_api.notes.id
  resource_id = aws_api_gateway_resource.jwt.id
  http_method = aws_api_gateway_method.options_jwt.http_method
  status_code = "200"
  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin"  = true
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
  }
}

resource "aws_api_gateway_integration_response" "options_jwt_200" {
  rest_api_id = aws_api_gateway_rest_api.notes.id
  resource_id = aws_api_gateway_resource.jwt.id
  http_method = aws_api_gateway_method.options_jwt.http_method
  status_code = aws_api_gateway_method_response.options_jwt_200.status_code
  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,Authorization'"
    "method.response.header.Access-Control-Allow-Methods" = "'OPTIONS,GET'"
  }
  response_templates = { "application/json" = "" }

  depends_on = [aws_api_gateway_integration.options_jwt]
}

resource "aws_api_gateway_method_settings" "default_settings" {
  rest_api_id = aws_api_gateway_rest_api.notes.id
  stage_name  = aws_api_gateway_stage.stage.stage_name
  method_path = "*/*"

  settings {
    caching_enabled      = false
    cache_ttl_in_seconds = 0
    cache_data_encrypted = false

    metrics_enabled = true
  }
}

resource "aws_api_gateway_method_settings" "jwt_get_cache" {
  rest_api_id = aws_api_gateway_rest_api.notes.id
  stage_name  = aws_api_gateway_stage.stage.stage_name
  method_path = "jwt/GET"

  settings {
    caching_enabled      = true
    cache_ttl_in_seconds = 30
    cache_data_encrypted = true
  }
}

resource "aws_api_gateway_method_settings" "userinfo_get_cache" {
  rest_api_id = aws_api_gateway_rest_api.notes.id
  stage_name  = aws_api_gateway_stage.stage.stage_name
  method_path = "userinfo/GET"

  settings {
    caching_enabled      = true
    cache_ttl_in_seconds = 30
    cache_data_encrypted = true
  }
}
