# Public website

resource "aws_s3_bucket" "spa_bucket" {
  bucket = var.project
}

resource "aws_s3_bucket_website_configuration" "spa_bucket" {
  bucket = aws_s3_bucket.spa_bucket.id
  index_document { suffix = "index.html" }
  error_document { key = "index.html" }
}

resource "aws_s3_bucket_public_access_block" "spa_bucket" {
  bucket                  = aws_s3_bucket.spa_bucket.id
  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

resource "aws_s3_bucket_policy" "spa_public_read" {
  bucket = aws_s3_bucket.spa_bucket.id
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Sid       = "PublicRead",
      Effect    = "Allow",
      Principal = "*",
      Action    = "s3:GetObject",
      Resource  = "${aws_s3_bucket.spa_bucket.arn}/*"
    }]
  })

  depends_on = [aws_s3_bucket_public_access_block.spa_bucket]
}

resource "aws_s3_object" "spa_index" {
  bucket = aws_s3_bucket.spa_bucket.id
  key    = "index.html"
  content = templatefile("${path.module}/${var.public_website_dir_path}/index.html", {
    aws_region    = var.aws_region
    user_pool_id  = aws_cognito_user_pool.main_pool.id
    app_client_id = aws_cognito_user_pool_client.spa_client.id
    api_base_url  = aws_api_gateway_stage.stage.invoke_url
  })
  content_type = "text/html"
  etag = md5(templatefile("${path.module}/${var.public_website_dir_path}/index.html", {
    aws_region    = var.aws_region
    user_pool_id  = aws_cognito_user_pool.main_pool.id
    app_client_id = aws_cognito_user_pool_client.spa_client.id
    api_base_url  = aws_api_gateway_stage.stage.invoke_url
  }))
}
