variable "aws_region" {
  type        = string
  description = "Region for EC2 and S3. ACM for CloudFront stays in us-east-1."
  default     = "ap-south-1"
}

variable "environment" {
  type        = string
  description = "Deployment environment name used in tags and IAM."
  default     = "production"
}

variable "project" {
  type        = string
  description = "Short name used as a resource prefix."
  default     = "portfolio"
}

variable "github_org" {
  type    = string
  default = "swe-rezaul-karim"
}

variable "github_repo" {
  type    = string
  default = "portfolio"
}

variable "domain_name" {
  type        = string
  description = "Apex domain, for example rezaul.dev."
  default     = "rezaul.dev"
}

variable "www_hostname" {
  type        = string
  description = "Public hostname served by CloudFront."
  default     = "www.rezaul.dev"
}

variable "hosted_zone_id" {
  type        = string
  description = "Route 53 hosted zone ID. Leave empty to skip ACM and DNS records."
  default     = ""
}

variable "instance_type" {
  type        = string
  description = "ARM instance type. t4g.small is the intended production size."
  default     = "t4g.small"
}

variable "ssh_public_key" {
  type        = string
  description = "Public key installed on the instance for GitHub Actions SSH."
  default     = ""
}

variable "ssh_ingress_cidrs" {
  type        = list(string)
  description = "CIDRs allowed to SSH. Restrict this in production."
  default     = ["0.0.0.0/0"]
}

variable "github_oidc_provider_arn" {
  type        = string
  description = "Existing GitHub OIDC provider ARN. Leave empty to create one."
  default     = ""
}
