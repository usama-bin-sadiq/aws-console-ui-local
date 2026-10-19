/**
 * RDS Types
 */

export interface RDSInstanceConfig {
  DBInstanceIdentifier?: string;
  DBInstanceClass?: string;
  Engine?: "mysql" | "postgres" | "mariadb" | "oracle-se2" | "sqlserver-ex";
  MasterUsername?: string;
  MasterUserPassword?: string;
  AllocatedStorage?: number;
  MultiAZ?: boolean;
  Tags?: Array<{ Key?: string; Value?: string }>;
}

export interface RDSInstance {
  DBInstanceIdentifier?: string;
  DBInstanceClass?: string;
  Engine?: string;
  DBInstanceStatus?: string;
  Endpoint?: {
    Address?: string;
    Port?: number;
  };
  AllocatedStorage?: number;
  MultiAZ?: boolean;
  InstanceCreateTime?: string;
  MasterUsername?: string;
  DBName?: string;
  AvailabilityZone?: string;
  StorageEncrypted?: boolean;
  DBParameterGroups?: Array<{ DBParameterGroupName?: string; ParameterApplyStatus?: string }>;
  Tags?: Array<{ Key?: string; Value?: string }>;
}

export interface RDSDBSnapshot {
  DBSnapshotIdentifier?: string;
  DBInstanceIdentifier?: string;
  SnapshotCreateTime?: string;
  Engine?: string;
  Status?: string;
  AllocatedStorage?: number;
  StorageType?: string;
  DBInstanceStatus?: string;
}
