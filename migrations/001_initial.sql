CREATE SCHEMA IF NOT EXISTS htmlinks;
REVOKE ALL ON SCHEMA htmlinks FROM PUBLIC;
-- One internal instance ledger, not an account or customer workspace.
CREATE TABLE htmlinks.workspaces (
 id uuid PRIMARY KEY, used_bytes bigint NOT NULL DEFAULT 0 CHECK(used_bytes >= 0),
 quota_bytes bigint NOT NULL DEFAULT 10737418240 CHECK(quota_bytes > 0)
);
INSERT INTO htmlinks.workspaces(id) VALUES ('00000000-0000-4000-8000-000000000001');
CREATE TABLE htmlinks.documents (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL REFERENCES htmlinks.workspaces(id),
 public_id text NOT NULL UNIQUE, management_hash text NOT NULL UNIQUE,
 title text NOT NULL, category text NOT NULL,
 access text NOT NULL DEFAULT 'link' CHECK(access IN ('private','link','password')),
 password_hash text, policy_version integer NOT NULL DEFAULT 1, version integer NOT NULL DEFAULT 1,
 revision integer NOT NULL DEFAULT 1, size integer NOT NULL, current_revision_id uuid,
 expires_at timestamptz, deleted_at timestamptz, created_by text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(id, workspace_id), CHECK ((access = 'password') = (password_hash IS NOT NULL))
);
CREATE TABLE htmlinks.document_revisions (
 id uuid PRIMARY KEY, document_id uuid NOT NULL, workspace_id uuid NOT NULL,
 number integer NOT NULL, storage_key text NOT NULL UNIQUE, checksum text NOT NULL,
 size integer NOT NULL CHECK(size > 0), filename text NOT NULL,
 created_by text NOT NULL, created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(document_id, number), UNIQUE(id, document_id, workspace_id),
 FOREIGN KEY(document_id, workspace_id) REFERENCES htmlinks.documents(id, workspace_id) ON DELETE CASCADE
);
ALTER TABLE htmlinks.documents ADD CONSTRAINT current_revision_belongs_to_document
 FOREIGN KEY(current_revision_id, id, workspace_id)
 REFERENCES htmlinks.document_revisions(id, document_id, workspace_id) DEFERRABLE INITIALLY DEFERRED;
CREATE TABLE htmlinks.viewer_grants (
 digest text PRIMARY KEY, document_id uuid NOT NULL REFERENCES htmlinks.documents(id) ON DELETE CASCADE,
 policy_version integer NOT NULL, kind text NOT NULL CHECK(kind IN ('session','handoff')),
 expires_at timestamptz NOT NULL
);
CREATE TABLE htmlinks.idempotency_keys (
 actor_key text NOT NULL, key text NOT NULL, fingerprint text NOT NULL, response jsonb NOT NULL,
 status integer NOT NULL, expires_at timestamptz NOT NULL DEFAULT now() + interval '24 hours',
 PRIMARY KEY(actor_key, key)
);
CREATE TABLE htmlinks.audit_events (
 id bigserial PRIMARY KEY, workspace_id uuid NOT NULL REFERENCES htmlinks.workspaces(id),
 actor_id text NOT NULL, document_id uuid, action text NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE htmlinks.rate_limits (key text PRIMARY KEY, count integer NOT NULL, resets_at timestamptz NOT NULL);
CREATE TABLE htmlinks.maintenance_jobs (
 storage_key text PRIMARY KEY, workspace_id uuid NOT NULL REFERENCES htmlinks.workspaces(id),
 size integer NOT NULL, attempts integer NOT NULL DEFAULT 0, available_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX documents_deleted ON htmlinks.documents(deleted_at) WHERE deleted_at IS NOT NULL;
