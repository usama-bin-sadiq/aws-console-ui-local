/**
 * RDS Constants
 */
export const RDS_DEFAULT_ENGINE = "mysql";
export const RDS_DEFAULT_CLASS = "db.t3.micro";
export const RDS_ENGINE_OPTIONS = [
  "mysql",
  "postgres",
  "mariadb",
  "oracle-se2",
  "sqlserver-ex",
] as const;
export const RDS_INSTANCE_STATUS_AVAILABLE = "available";
export const RDS_INSTANCE_STATUS_CREATING = "creating";
export const RDS_INSTANCE_STATUS_MODIFYING = "modifying";
export const RDS_INSTANCE_STATUS_REBOOTING = "rebooting";
export const RDS_INSTANCE_STATUS_DELETING = "deleting";
export const RDS_INSTANCE_STATUS_STARTING = "starting";
export const RDS_INSTANCE_STATUS_STOPPING = "stopping";
export const RDS_INSTANCE_STATUS_BACKING_UP = "backing-up";
export const RDS_INSTANCE_STATUS_FAILED = "failed";
