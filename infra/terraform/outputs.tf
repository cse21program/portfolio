output "frontend_bucket" {
  value = aws_s3_bucket.frontend.bucket
}

output "uploads_bucket" {
  value = aws_s3_bucket.uploads.bucket
}

output "cloudfront_distribution_id" {
  value = aws_cloudfront_distribution.www.id
}

output "cloudfront_domain_name" {
  value = aws_cloudfront_distribution.www.domain_name
}

output "ec2_instance_id" {
  value = aws_instance.api.id
}

output "ec2_public_ip" {
  value = aws_eip.api.public_ip
}

output "github_deploy_role_arn" {
  value = aws_iam_role.github_deploy.arn
}

output "public_url" {
  value = var.hosted_zone_id == "" ? "https://${aws_cloudfront_distribution.www.domain_name}" : "https://${var.www_hostname}"
}

output "github_actions_configuration" {
  value = {
    AWS_REGION                 = var.aws_region
    AWS_DEPLOY_ROLE_ARN        = aws_iam_role.github_deploy.arn
    FRONTEND_BUCKET            = aws_s3_bucket.frontend.bucket
    CLOUDFRONT_DISTRIBUTION_ID = aws_cloudfront_distribution.www.id
    DEPLOY_HOST                = aws_eip.api.public_ip
    DEPLOY_USER                = "ec2-user"
    DEPLOY_PATH                = "/opt/portfolio"
  }
}
