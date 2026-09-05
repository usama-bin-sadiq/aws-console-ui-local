# AWS Emulator Console

## Product Requirements Document

**Status:** Draft for implementation
**Scope:** A browser console for AWS-compatible services exposed by MiniStack and LocalStack
**UI system:** AWS Cloudscape Design System
**Authentication:** None. Local development access is immediate; MFA, AWS sign-in, IAM sign-in, SSO, account creation, password recovery, and billing identity flows are out of scope.

## 1. Purpose

Build an AWS Management Console-style interface for local development and testing. The console must preserve the information architecture and task flow of the AWS web console while exposing only services and operations that the selected local emulator can verify and execute.

This is an emulator console, not an AWS account console. It must never imply that an operation ran against AWS, that a local service has full AWS parity, or that a service is available merely because AWS offers it.

## 2. Evidence And Scope Rules

### 2.1 Public references

The product decisions in this document are based on:

- AWS Management Console public user guidance: https://docs.aws.amazon.com/awsconsolehelpdocs/latest/gsg/
- AWS Cloudscape component documentation: https://cloudscape.design/components/
- Cloudscape responsive design principles: https://cloudscape.design/foundation/core-principles/responsive-design/
- Cloudscape accessibility principles: https://cloudscape.design/foundation/core-principles/accessibility/
- LocalStack service catalog: https://docs.localstack.cloud/aws/services/
- LocalStack feature coverage: https://docs.localstack.cloud/references/coverage/

MiniStack support must be taken from the MiniStack distribution's published capability documentation or its runtime capability endpoint. No MiniStack service or operation may be invented from the AWS service catalog.

### 2.2 Service inclusion rule

The visible service catalog is the intersection of:

1. The active provider's capability manifest.
2. The active provider's health state.
3. The local console's implemented operation manifest.

For a selected provider, a service is **visible** only when all three agree that it is available. A service is **disabled** when the provider reports it as unavailable or unsupported. A service is **partial** when the provider exposes the service but marks one or more operations as unsupported. A service is never shown as fully supported by inference from its AWS name alone.

The LocalStack public service directory is the candidate catalog for LocalStack. The MiniStack runtime manifest is authoritative for MiniStack. The console must support different visible catalogs when the provider changes.

### 2.3 No fabricated parity

- Do not display unsupported AWS services as working links.
- Do not render fake resources, fake counts, fake metrics, fake events, or fake operation success.
- Do not replace an emulator error with a success state.
- Do not label a partial operation as complete.
- Do not expose real AWS endpoints from this product.
- Every service page must show provider name, region, health, and capability state.

## 3. Users And Primary Outcomes

### Local application developer
Create and inspect local AWS-compatible resources using familiar AWS console workflows.

### Test engineer
Repeat resource lifecycle actions, inspect responses, and identify provider capability gaps.

### Platform engineer
Switch between MiniStack and LocalStack, compare available services, and trace cross-service configuration.

The primary outcome is reliable local task completion with an accurate explanation when the emulator cannot perform an operation.

## 4. Provider And Capability Model

The console shall maintain a provider session containing:

| Field | Requirement |
|---|---|
| Provider | `ministack` or `localstack` |
| Endpoint | Displayed host and port; editable only through an explicit provider settings flow |
| Region | Current emulated region; changing it reloads provider capabilities and resources |
| Health | `checking`, `healthy`, `degraded`, or `unreachable` |
| Services | Service name, service key, status, and optional documentation URL |
| Operations | Operation key, read/write classification, support status, and reason |
| Last checked | Locale-formatted timestamp |

The capability manifest must distinguish service availability from operation support. A healthy provider may still report a service or operation as unsupported.

When capability data is missing, the UI must show `Unknown` and prevent mutating actions. Read actions may run only when the provider contract explicitly permits optimistic discovery; errors must remain visible.

## 5. AWS Console Information Architecture

The console shall follow the recognizable AWS console structure without copying private implementation details:

```text
Top navigation
  Provider selector | global service search | region selector | help | preferences

AppLayout
  SideNavigation: Home, Favorites, Recently visited, available services by category
  BreadcrumbGroup: Home > Service > Resource collection > Resource
  Content: service header, actions, filters, collection, details
  Notifications: Flashbar
  Tools: HelpPanel or service guidance
  SplitPanel: selected-resource details where appropriate
```

Cloudscape `AppLayout` owns the page regions. Cloudscape `TopNavigation` remains persistent across pages. Cloudscape `SideNavigation` owns service links. Services must not create separate navigation systems that diverge from the shell.

## 6. Navigation And Service Linking

### 6.1 Home

Home contains:

- Active provider and endpoint status.
- Current region.
- Available service categories derived from the capability manifest.
- Favorites and recently visited services.
- Recent local resources only when returned by provider APIs.
- A clear empty state when no provider is reachable.

Unavailable services are not shown as normal navigation links. If comparison or diagnostics needs to expose them, they appear in a separate `Unavailable` view with the provider-reported reason and no enabled action.

### 6.2 Service catalog

The catalog is generated from capability data, not a static list of all AWS services. Each service item includes:

- Official AWS display name and stable provider service key.
- Cloudscape icon or an approved generic service icon when no specific icon is available.
- Support state: `Available`, `Partial`, `Unavailable`, or `Unknown`.
- Provider name and region scope.
- Link to the service root only when the service is enabled.

The active provider switch must refresh the catalog, favorites validity, recent-link validity, and current route state. A route for a service that becomes unavailable must render an unavailable state rather than a fabricated page.

### 6.3 Cross-service links

Links are data-driven and must use stable service keys and resource identifiers. Examples:

| Origin | Link target | Condition |
|---|---|---|
| EC2 instance details | VPC, subnet, security group, IAM role, EBS volume, CloudWatch logs | Target resource identifier is present and target service is enabled |
| Lambda function details | IAM role, CloudWatch log group, event source, S3 bucket, SNS topic, SQS queue | Relationship is returned by the provider and target service is enabled |
| S3 bucket details | Lambda notification, SNS topic, SQS queue, CloudWatch metrics | Configuration references a target and target service is enabled |
| ECS service details | Cluster, task definition, ECR repository, load balancer, CloudWatch logs | Relationship is returned by the provider and target service is enabled |
| RDS details | VPC, subnet group, security group, snapshots, CloudWatch metrics | Relationship is returned by the provider and target service is enabled |
| EventBridge rule details | Event bus, target Lambda/SNS/SQS/Step Functions service | Target operation and target service are supported |
| CloudFormation stack details | Stack resources and their service pages | Resource type has a known enabled service mapping |

If a target service is unavailable, the relationship remains readable as plain text with an unavailable indicator. It must not become a dead or misleading link.

### 6.4 Global search

Global search uses Cloudscape `Autosuggest` or `Input` and searches:

- Enabled service names and service keys.
- Provider-returned resource identifiers, names, and ARNs where available.
- Current-region resources first, then an explicitly selected broader scope.

Search results must identify whether the result is a service, resource, or relationship. Unsupported services and unverified resources must not appear as actionable results.

## 7. Service Page Contract

Every enabled service page follows the same Cloudscape composition:

1. `BreadcrumbGroup` with Home, service, and resource context.
2. `Header` with service name, provider badge, region, health state, and documentation/help affordance.
3. Primary action buttons only for supported write operations.
4. `Table` for collections with `PropertyFilter` or `TextFilter`, pagination, sorting, selection, and `CollectionPreferences`.
5. `Container`, `Tabs`, and `KeyValuePairs` for resource details.
6. `SplitPanel` for quick inspection when it improves the AWS-style collection workflow.
7. `Flashbar` for operation results and provider errors.
8. `Modal` for destructive-action confirmation.
9. `Wizard` for multi-step creation flows.
10. `HelpPanel` for service and operation guidance derived from public provider documentation.

The page must show a service-specific operation manifest. Unsupported operations are either omitted from action menus or shown disabled with the provider's reason, consistently across tables, detail pages, and wizards.

## 8. Common Resource Workflows

### 8.1 Discover

1. User opens Home.
2. Console checks provider health and capabilities.
3. User chooses a visible service from search, category, favorite, or recent link.
4. Console opens the service collection in the current region.

### 8.2 Create

1. User selects a supported primary create action.
2. `Wizard` presents only fields required by the provider-supported operation set.
3. Each step validates input locally and reports provider constraints where known.
4. Review step displays the exact request summary, provider, endpoint label, and region.
5. Submit sends one provider request and shows progress.
6. Success is shown only after a successful provider response.
7. The collection refreshes and the created resource is linkable by its returned identifier.

### 8.3 Inspect

1. User selects a collection item.
2. Split panel or details route opens with returned properties.
3. Related-resource links are resolved through the capability-aware link registry.
4. Missing, stale, or unsupported properties are labelled clearly rather than filled with placeholders.

### 8.4 Update

1. User chooses an enabled update operation.
2. Form shows current provider-returned values.
3. Confirmation summarizes changed fields.
4. On success, the details view refreshes from the provider.

### 8.5 Delete or other destructive action

1. User selects the resource and action.
2. `Modal` identifies the resource, provider, region, and irreversible consequences.
3. Confirmation requires an explicit action; keyboard focus is contained in the modal.
4. Failure leaves the resource visible and reports the provider error.
5. Success removes or updates the resource only after the provider confirms it.

## 9. Service Families And Candidate Discovery

LocalStack publicly documents a broad catalog including, among others, API Gateway, AppConfig, AppSync, Athena, CloudFormation, CloudFront, CloudTrail, CloudWatch, DynamoDB, EC2, ECR, ECS, EFS, EKS, EventBridge, Glue, IAM, IoT, Kinesis, KMS, Lambda, OpenSearch, RDS, Redshift, Route 53, S3, Secrets Manager, SNS, SQS, Step Functions, Systems Manager, X-Ray, and additional services.

This list is a discovery reference only, not a permission to display all of these services. The implementation must filter it through the active LocalStack capability response and the local operation manifest. MiniStack must be filtered through its own published or runtime capability response. Service families shown in the UI should follow the AWS console grouping model, but empty categories should be hidden.

## 10. Cloudscape Design Requirements

All visible UI must use Cloudscape components, patterns, icons, and design tokens. Custom visual styling must not replace Cloudscape behavior.

Required components include:

- `AppLayout`, `TopNavigation`, `SideNavigation`
- `BreadcrumbGroup`, `ContentLayout`, `Header`, `Container`, `ColumnLayout`, `Grid`
- `Table`, `PropertyFilter`, `TextFilter`, `Pagination`, `CollectionPreferences`
- `Button`, `ButtonDropdown`, `Select`, `Multiselect`, `Toggle`, `Checkbox`
- `Form`, `FormField`, `Wizard`, `Modal`, `Drawer`, `SplitPanel`
- `Tabs`, `KeyValuePairs`, `StatusIndicator`, `Badge`, `ProgressBar`
- `Flashbar`, `Alert`, `ExpandableSection`, `HelpPanel`
- `CodeEditor` or `CodeView` for provider request/response or policy documents when the operation supports them

Use Cloudscape design tokens for color, typography, spacing, borders, elevation, and motion. Use the Cloudscape icon component and documented iconography. Do not draw replacement SVG icons for standard controls.

### Density and layout

The default experience is information-dense, like the AWS console, while preserving readable labels, clear hierarchy, and adequate hit targets. Use Cloudscape collection preferences where density is user-configurable. Avoid decorative cards and avoid nesting cards inside cards.

## 11. Responsive Requirements

Responsive behavior must be fluid rather than designed around a single device size.

- At 320px width, all content remains readable and all core actions remain reachable.
- At 400% browser zoom, content and controls remain usable without hidden primary actions.
- Side navigation collapses using `AppLayout` behavior.
- Tools, drawers, split panels, filters, and modals adapt to the viewport and must not cover their confirmation or close actions.
- Wide tables use horizontal scrolling or an intentional responsive collection treatment; columns must not silently lose meaning.
- Resource detail layouts collapse from columns to a readable vertical flow.
- Long service names, identifiers, errors, and capability reasons wrap or truncate with accessible full text.
- Touch interaction must not depend on hover.
- No fixed positioning may obstruct content or controls.
- The same supported functionality remains available at smaller widths; only its presentation changes.

## 12. Accessibility

Follow Cloudscape component usage guidance and WCAG 2.1 AA:

- Use semantic landmarks supplied by Cloudscape.
- Provide meaningful labels for navigation, search, buttons, filters, dialogs, and status changes.
- Preserve visible keyboard focus and logical tab order.
- Contain focus in modal dialogs and return focus to the invoking control.
- Announce asynchronous loading, success, failure, and provider state changes through accessible live regions or Cloudscape notification patterns.
- Do not rely on color alone for support state, health, or destructive actions.
- Ensure text and controls meet contrast requirements.
- Support reduced motion preferences.
- Provide accessible names and descriptions for service icons.

## 13. Error And Empty States

| Condition | UI response |
|---|---|
| Provider unreachable | Full-page or service-level `Alert`; keep navigation usable; show retry and provider settings actions |
| Capability check in progress | Skeleton or loading state; prevent unsupported writes |
| Service unavailable | Service unavailable state with provider reason; no create/update/delete actions |
| Operation partial | `StatusIndicator` and inline explanation; allow only supported operations |
| Empty collection | Cloudscape empty state with a supported create action when available |
| Provider returns no data | Show an empty result, never a fabricated resource |
| Provider request failure | Flashbar with safe error detail, operation name, and retry guidance |
| Stale relationship | Plain identifier with stale/unresolved status; do not create a dead link |
| Invalid form | Field-level validation and summary; preserve entered values |

## 14. Security And Data Boundaries

- No login or MFA flow is required.
- No real AWS credential collection is permitted in the UI.
- Local provider requests must use the emulator's documented local authentication behavior.
- The UI must visibly identify the active local provider and endpoint label.
- Do not send local test credentials or resource data to third-party analytics.
- Never place secret values in URLs, breadcrumbs, search history, logs, or error messages.
- Redact secret values in request previews and response viewers.
- The console must prevent accidental navigation to a real AWS endpoint.

## 15. Acceptance Criteria

### Service visibility

- Given a provider capability manifest, when Home loads, then only the intersection of provider-enabled services and implemented services is shown as actionable.
- Given a service marked unsupported, when the user searches for it, then the result is either absent or explicitly unavailable and cannot open a working service page.
- When the provider changes, then the catalog, navigation, favorites, recent links, and current page state are reconciled with the new manifest.

### Linking

- Given a returned resource relationship and an enabled target service, then the relationship is a working Cloudscape link to the target resource.
- Given a returned relationship and an unavailable target service, then the identifier remains visible with an unavailable state and no dead link.
- Given a missing relationship identifier, then no fabricated link or placeholder resource is rendered.

### Workflows

- A supported create workflow submits only provider-supported fields and reports the actual provider response.
- A destructive workflow requires explicit confirmation and shows provider and region context.
- A provider failure leaves the UI consistent with the last confirmed provider state.
- A successful mutation refreshes the collection from the provider before showing the final success state.

### Responsive and accessible behavior

- Home, service collections, details, forms, modals, drawers, and split panels remain usable at 320px and 400% zoom.
- Keyboard users can reach every enabled action and can operate navigation, filters, tables, dialogs, and wizards.
- Dynamic provider and operation results are announced accessibly.

## 16. Out Of Scope

- AWS production account management.
- AWS root, IAM, SSO, password, MFA, or federated login.
- Billing, payment methods, real account limits, and real AWS support cases.
- Services not reported by the active emulator.
- Claims of complete AWS API parity.
- Synthetic demo data presented as live emulator data.
- A static catalog that ignores provider capabilities.

## 17. Definition Of Done

- Every visible service has a capability record, health state, operation manifest, route, icon treatment, and Cloudscape page contract.
- Every service link is capability-aware and tested for enabled, disabled, stale, and missing targets.
- Every mutation has provider-confirmed success, error, loading, and retry states.
- Responsive checks cover 320px, desktop, and 400% zoom behavior.
- Keyboard and screen-reader checks cover the shell, catalog, collection, details, wizard, modal, and notifications.
- Documentation links point to public AWS, Cloudscape, LocalStack, or MiniStack sources; unknown MiniStack behavior remains explicitly unknown until verified.