/**
 * RDS Types
 */

export interface RDSInstanceConfig {
  DBInstanceIdentifier?: string;
  DBInstanceClass?: string;
  Engine?: 'mysql' | 'postgres' | 'mariadb' | 'oracle-se2' | 'sqlserver-ex';
  MasterUsername?: string;
  MasterUserPassword?: string;
  AllocatedStorage?: number;
  MultiAZ?: boolean;
  Tags?: Array<{ Key?: string; Value?: string }>;
}
