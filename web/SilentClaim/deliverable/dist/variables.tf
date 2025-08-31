variable "project" {
  description = "Project name prefix"
  type        = string
  default     = "silentclaim"
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "eu-central-1"
}

variable "aws_profile" {
  description = "Optional AWS CLI profile name"
  type        = string
  default     = "default"
}

variable "stage_name" {
  type    = string
  default = "prod"
}

variable "cognito_lambda_trigger_path" {
  type    = string
  default = "cognito-lambda-trigger"
}

variable "lambda_authorizer_path" {
  type    = string
  default = "lambda-authorizer"
}

variable "public_website_dir_path" {
  type    = string
  default = "public-website"
}

variable "rebuild_lambdas" {
  description = "Rebuild lambdas"
  type        = bool
  default     = false
}

