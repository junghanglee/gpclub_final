# GPCLUB Supabase 백업 운영 가이드

## 백업 범위

`.github/workflows/supabase-backup.yml`은 매일 한국시간 03:15에 다음 항목을 백업한다.

- PostgreSQL 역할 백업: `database/roles.sql`
- 애플리케이션 스키마 백업: `database/schema.sql`
- 애플리케이션 데이터 백업: `database/data.sql`
- 모든 Supabase Storage 버킷과 원본 파일
- 버킷 설정, 파일 크기 및 SHA-256이 포함된 `storage/storage-manifest.json`
- GPG AES-256으로 암호화된 전체 압축파일과 SHA-256 체크섬

백업은 GitHub Actions artifact로 30일간 보관된다. Actions 화면에서 `Supabase backup` 실행을 선택하면 수동 백업도 가능하다.

## 최초 1회 설정

GitHub 저장소의 `Settings > Secrets and variables > Actions`에 다음 Repository secret을 등록한다.

| Secret                         | 값                                                                                            |
| ------------------------------ | --------------------------------------------------------------------------------------------- |
| `SUPABASE_ACCESS_TOKEN`        | Supabase Dashboard의 Account > Access Tokens에서 만든 백업 전용 Personal Access Token.        |
| `SUPABASE_SERVICE_ROLE_KEY`    | Supabase Dashboard의 현재 service role secret key. 브라우저나 소스 코드에는 절대 넣지 않는다. |
| `BACKUP_ENCRYPTION_PASSPHRASE` | 백업 암호화 전용의 충분히 긴 무작위 복구키. GitHub 외부에도 안전하게 보관한다.                |

설정 후 `Actions > Supabase backup > Run workflow`를 실행하고 아래를 확인한다.

1. 모든 단계가 성공했는지 확인한다.
2. 실행 화면의 artifact를 내려받는다.
3. `.sha256` 파일로 암호화 파일의 체크섬을 확인한다.
4. 아래 명령으로 복호화한다.
5. 압축을 풀어 `roles.sql`, `schema.sql`, `data.sql`, `storage-manifest.json`이 존재하는지 확인한다.

```bash
sha256sum --check gpclub-supabase-*.tar.gz.gpg.sha256
gpg --output gpclub-supabase.tar.gz --decrypt gpclub-supabase-*.tar.gz.gpg
tar -xzf gpclub-supabase.tar.gz
```

GPG가 묻는 암호에는 `BACKUP_ENCRYPTION_PASSPHRASE` 복구키를 입력한다. 복구키를 잃으면 백업을 복호화할 수 없다.

## DB 복구 예시

복구는 기존 운영 DB가 아니라 빈 테스트 PostgreSQL에서 먼저 검증한다.

```bash
createdb gpclub_restore_test
psql --set ON_ERROR_STOP=on \
  --dbname="postgresql://USER:PASSWORD@HOST:5432/gpclub_restore_test" \
  --file=database/roles.sql
psql --set ON_ERROR_STOP=on \
  --dbname="postgresql://USER:PASSWORD@HOST:5432/gpclub_restore_test" \
  --file=database/schema.sql
psql --set ON_ERROR_STOP=on \
  --dbname="postgresql://USER:PASSWORD@HOST:5432/gpclub_restore_test" \
  --file=database/data.sql
```

Supabase 전용 확장이나 역할 때문에 오류가 발생하면 Cloudzy의 PostgreSQL 버전과 필요한 확장을 먼저 맞춘다. Supabase CLI 백업은 플랫폼이 관리하는 `auth`, `storage` 등의 내부 스키마를 제외한다. 관리자 계정은 새 인증 시스템에서 다시 만들고, Storage 파일과 버킷 설정은 별도 manifest로 복구한다.

## Storage 복구 원칙

`storage/<bucket-name>/...` 아래의 파일을 동일한 버킷과 객체 경로로 업로드한다. `storage-manifest.json`의 `public`, `fileSizeLimit`, `allowedMimeTypes`로 버킷을 먼저 만들고, 업로드 후 각 파일의 SHA-256을 비교한다.

Cloudzy 이전 시에는 이 파일 구조를 그대로 VPS의 오브젝트 스토리지 또는 로컬 볼륨에 복사할 수 있다. 웹 데이터에 저장된 기존 Supabase 공개 URL은 새 파일 URL로 일괄 마이그레이션해야 한다.

## 보관 정책

- 매일 백업, 30일 보관
- 공개 GitHub 저장소에는 암호화된 파일만 업로드
- 월 1회 백업은 PC 또는 Cloudzy 외부 저장소에 별도 장기 보관 권장
- Cloudzy 개통 후 artifact 업로드 다음 단계에 VPS/S3 호환 저장소 전송을 추가
- 최소 분기 1회 빈 테스트 DB와 임시 Storage에서 복구 훈련 수행
