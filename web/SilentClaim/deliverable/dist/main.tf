terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.60"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.5"
    }
    external = {
      source  = "hashicorp/external"
      version = "~> 2.3"
    }
  }

  cloud {
    organization = "main-infra"

    workspaces {
      name = "tfcctf-silentclaim"
    }
  }
}

provider "aws" {
  region  = var.aws_region
  profile = var.aws_profile
}

locals {
  root_dir = abspath(path.module)
}

output "user_pool_id" {
  value = aws_cognito_user_pool.main_pool.id
}

output "user_pool_client_id" {
  value = aws_cognito_user_pool_client.spa_client.id
}

output "spa_website_endpoint" {
  value = aws_s3_bucket_website_configuration.spa_bucket.website_endpoint
}

output "api_base_url" {
  value = aws_api_gateway_stage.stage.invoke_url
}
