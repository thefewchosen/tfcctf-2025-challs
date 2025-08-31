# IDP Definitions

resource "aws_iam_role" "cognito_lambda_trigger_role" {
  name = "${var.project}-cognito-lambda-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Effect    = "Allow",
      Principal = { Service = "lambda.amazonaws.com" },
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_basic" {
  role       = aws_iam_role.cognito_lambda_trigger_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "null_resource" "build_cognito_lambda" {
  triggers = {
    build_hash = sha1(join("", [
      for f in fileset(var.cognito_lambda_trigger_path, "**/*.go") : file("${var.cognito_lambda_trigger_path}/${f}")
    ])),
    rebuild = var.rebuild_lambdas
  }

  provisioner "local-exec" {
    command = <<-EOT
      mkdir -p "${local.root_dir}/${var.cognito_lambda_trigger_path}/build"
      rm -f "${local.root_dir}/${var.cognito_lambda_trigger_path}/build/cognito-lambda-trigger" || true
      rm -f "${local.root_dir}/${var.cognito_lambda_trigger_path}/build/cognito-lambda-trigger.zip" || true

      echo "Building Go lambda (linux/amd64)..."
      cd "${local.root_dir}/${var.cognito_lambda_trigger_path}"

      GOOS=linux GOARCH=amd64 CGO_ENABLED=0 go build -ldflags="-s -w" -o "${local.root_dir}/${var.cognito_lambda_trigger_path}/build/cognito-lambda-trigger" .

      echo "Zipping binary..."
      (cd "${local.root_dir}/${var.cognito_lambda_trigger_path}/build" && cp cognito-lambda-trigger bootstrap && zip -j "cognito-lambda-trigger.zip" "bootstrap")

      echo "Built cognito-lambda-trigger.zip"
    EOT
  }
}

resource "aws_lambda_function" "cognito_lambda_trigger" {
  function_name    = "${var.project}-cognito-lambda-trigger"
  role             = aws_iam_role.cognito_lambda_trigger_role.arn
  runtime          = "provided.al2"
  handler          = "bootstrap"
  filename         = "${local.root_dir}/${var.cognito_lambda_trigger_path}/build/cognito-lambda-trigger.zip"
  source_code_hash = null_resource.build_cognito_lambda.triggers.build_hash
  timeout          = 5

  depends_on = [null_resource.build_cognito_lambda]
}

resource "aws_lambda_permission" "allow_cognito" {
  statement_id  = "AllowExecutionFromCognito"
  action        = "lambda:InvokeFunction"
  principal     = "cognito-idp.amazonaws.com"
  function_name = aws_lambda_function.cognito_lambda_trigger.function_name
  source_arn    = aws_cognito_user_pool.main_pool.arn
}

resource "aws_cognito_user_pool" "main_pool" {
  name = "${var.project}-main-pool"

  auto_verified_attributes = ["email"]
  username_attributes      = ["email"]

  admin_create_user_config {
    allow_admin_create_user_only = false
  }

  password_policy {
    minimum_length    = 8
    require_lowercase = false
    require_uppercase = false
    require_numbers   = false
    require_symbols   = false
  }

  lambda_config {
    pre_token_generation_config {
      lambda_version = "V3_0"
      lambda_arn     = aws_lambda_function.cognito_lambda_trigger.arn
    }
  }

  schema {
    name                = "email"
    attribute_data_type = "String"
    required            = true
    mutable             = true

    string_attribute_constraints {
      min_length = 1
      max_length = 256
    }
  }
}

resource "aws_cognito_user_pool_client" "spa_client" {
  name         = "${var.project}-spa-client"
  user_pool_id = aws_cognito_user_pool.main_pool.id

  generate_secret               = false
  prevent_user_existence_errors = "ENABLED"

  explicit_auth_flows = [
    "ALLOW_USER_SRP_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH",
    "ALLOW_USER_PASSWORD_AUTH"
  ]

  access_token_validity  = 60
  id_token_validity      = 60
  refresh_token_validity = 30
  token_validity_units {
    access_token  = "minutes"
    id_token      = "minutes"
    refresh_token = "days"
  }
}
