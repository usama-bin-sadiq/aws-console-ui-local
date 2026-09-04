/**
 * EC2 Constants — Service-level constants for EC2 feature parity.
 */

export const EC2_DEFAULT_INSTANCE_TYPE = 't3.micro';
export const EC2_DEFAULT_IMAGE_ID = 'ami-0abcdef123456';
export const EC2_DEFAULT_VPC_ID = 'vpc-12345678';
export const EC2_DEFAULT_SUBNET_ID = 'subnet-12345678';
export const EC2_DEFAULT_KEY_PAIR = 'aws-console-key';

export const EC2_INSTANCE_STATES = [
  'running', 'stopped', 'pending', 'terminated', 'stopping', 'shutting-down'
] as const;

export const EC2_VOLUME_TYPES = ['gp2', 'gp3', 'io1', 'io2', 'st1', 'sc1', 'standard'] as const;
export const EC2_PLACEMENT_STRATEGIES = ['cluster', 'spread', 'partition'] as const;

export const EC2_SERVICE_ROUTE = '/ec2';
