locals {
  name = var.project
  tags = {
    Project     = var.project
    Environment = var.environment
    ManagedBy   = "terraform"
  }

  github_oidc_arn = var.github_oidc_provider_arn == "" ? aws_iam_openid_connect_provider.github[0].arn : var.github_oidc_provider_arn
  origin_hostname = format(
    "ec2-%s.%s.compute.amazonaws.com",
    replace(aws_eip.api.public_ip, ".", "-"),
    data.aws_region.current.name,
  )
}
