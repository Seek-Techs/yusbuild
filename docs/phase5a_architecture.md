openapi: 3.0.3
info:
  title: YusBuild API
  version: 1.0.0
  description: Pile Reinforcement Quantification API
paths:
  /api/auth/token/:
    post:
      operationId: auth_token_create
      description: |-
        Takes a set of user credentials and returns an access and refresh JSON web
        token pair to prove the authentication of those credentials.
      tags:
      - auth
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/TokenObtainPair'
          application/x-www-form-urlencoded:
            schema:
              $ref: '#/components/schemas/TokenObtainPair'
          multipart/form-data:
            schema:
              $ref: '#/components/schemas/TokenObtainPair'
        required: true
      responses:
        '200':
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/TokenObtainPair'
          description: ''
  /api/auth/token/refresh/:
    post:
      operationId: auth_token_refresh_create
      description: |-
        Takes a refresh type JSON web token and returns an access type JSON web
        token if the refresh token is valid.
      tags:
      - auth
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/TokenRefresh'
          application/x-www-form-urlencoded:
            schema:
              $ref: '#/components/schemas/TokenRefresh'
          multipart/form-data:
            schema:
              $ref: '#/components/schemas/TokenRefresh'
        required: true
      responses:
        '200':
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/TokenRefresh'
          description: ''
  /api/schema/:
    get:
      operationId: schema_retrieve
      description: |-
        OpenApi3 schema for this API. Format can be selected via content negotiation.

        - YAML: application/vnd.oai.openapi
        - JSON: application/vnd.oai.openapi+json
      parameters:
      - in: query
        name: format
        schema:
          type: string
          enum:
          - json
          - yaml
      - in: query
        name: lang
        schema:
          type: string
          enum:
          - af
          - ar
          - ar-dz
          - ast
          - az
          - be
          - bg
          - bn
          - br
          - bs
          - ca
          - ckb
          - cs
          - cy
          - da
          - de
          - dsb
          - el
          - en
          - en-au
          - en-gb
          - eo
          - es
          - es-ar
          - es-co
          - es-mx
          - es-ni
          - es-ve
          - et
          - eu
          - fa
          - fi
          - fr
          - fy
          - ga
          - gd
          - gl
          - he
          - hi
          - hr
          - hsb
          - hu
          - hy
          - ia
          - id
          - ig
          - io
          - is
          - it
          - ja
          - ka
          - kab
          - kk
          - km
          - kn
          - ko
          - ky
          - lb
          - lt
          - lv
          - mk
          - ml
          - mn
          - mr
          - ms
          - my
          - nb
          - ne
          - nl
          - nn
          - os
          - pa
          - pl
          - pt
          - pt-br
          - ro
          - ru
          - sk
          - sl
          - sq
          - sr
          - sr-latn
          - sv
          - sw
          - ta
          - te
          - tg
          - th
          - tk
          - tr
          - tt
          - udm
          - ug
          - uk
          - ur
          - uz
          - vi
          - zh-hans
          - zh-hant
      tags:
      - schema
      security:
      - jwtAuth: []
      - {}
      responses:
        '200':
          content:
            application/vnd.oai.openapi:
              schema:
                type: object
                additionalProperties: {}
            application/yaml:
              schema:
                type: object
                additionalProperties: {}
            application/vnd.oai.openapi+json:
              schema:
                type: object
                additionalProperties: {}
            application/json:
              schema:
                type: object
                additionalProperties: {}
          description: ''
  /api/v1/approvals/approve/:
    post:
      operationId: v1_approvals_approve_create
      tags:
      - v1
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ApprovalDecisionRequest'
          application/x-www-form-urlencoded:
            schema:
              $ref: '#/components/schemas/ApprovalDecisionRequest'
          multipart/form-data:
            schema:
              $ref: '#/components/schemas/ApprovalDecisionRequest'
        required: true
      security:
      - jwtAuth: []
      responses:
        '200':
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ApprovalDecisionRequest'
          description: ''
  /api/v1/approvals/comments/:
    post:
      operationId: v1_approvals_comments_create
      tags:
      - v1
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ConsultantCommentRequest'
          application/x-www-form-urlencoded:
            schema:
              $ref: '#/components/schemas/ConsultantCommentRequest'
          multipart/form-data:
            schema:
              $ref: '#/components/schemas/ConsultantCommentRequest'
        required: true
      security:
      - jwtAuth: []
      responses:
        '200':
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ConsultantCommentRequest'
          description: ''
  /api/v1/approvals/reject/:
    post:
      operationId: v1_approvals_reject_create
      tags:
      - v1
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ApprovalDecisionRequest'
          application/x-www-form-urlencoded:
            schema:
              $ref: '#/components/schemas/ApprovalDecisionRequest'
          multipart/form-data:
            schema:
              $ref: '#/components/schemas/ApprovalDecisionRequest'
        required: true
      security:
      - jwtAuth: []
      responses:
        '200':
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ApprovalDecisionRequest'
          description: ''
  /api/v1/approvals/return-for-correction/:
    post:
      operationId: v1_approvals_return_for_correction_create
      tags:
      - v1
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ApprovalDecisionRequest'
          application/x-www-form-urlencoded:
            schema:
              $ref: '#/components/schemas/ApprovalDecisionRequest'
          multipart/form-data:
            schema:
              $ref: '#/components/schemas/ApprovalDecisionRequest'
        required: true
      security:
      - jwtAuth: []
      responses:
        '200':
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ApprovalDecisionRequest'
          description: ''
  /api/v1/certification/packages/:
    get:
      operationId: v1_certification_packages_list
      parameters:
      - in: query
        name: current_state
        schema:
          type: string
          enum:
          - APPROVED
          - CERTIFIED
          - DRAFT
          - LOCKED
          - SUBMITTED
        description: |-
          * `DRAFT` - Draft
          * `SUBMITTED` - Submitted
          * `APPROVED` - Approved
          * `CERTIFIED` - Certified
          * `LOCKED` - Locked
      - name: ordering
        required: false
        in: query
        description: Which field to use when ordering the results.
        schema:
          type: string
      - name: page
        required: false
        in: query
        description: A page number within the paginated result set.
        schema:
          type: integer
      - in: query
        name: project
        schema:
          type: integer
      - name: search
        required: false
        in: query
        description: A search term.
        schema:
          type: string
      tags:
      - v1
      security:
      - jwtAuth: []
      responses:
        '200':
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/PaginatedCertificationPackageList'
          description: ''
    post:
      operationId: v1_certification_packages_create
      tags:
      - v1
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CertificationPackage'
          application/x-www-form-urlencoded:
            schema:
              $ref: '#/components/schemas/CertificationPackage'
          multipart/form-data:
            schema:
              $ref: '#/components/schemas/CertificationPackage'
        required: true
      security:
      - jwtAuth: []
      responses:
        '201':
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/CertificationPackage'
          description: ''
  /api/v1/certification/packages/{id}/:
    get:
      operationId: v1_certification_packages_retrieve
      parameters:
      - in: path
        name: id
        schema:
          type: integer
        description: A unique integer value identifying this certification package.
        required: true
      tags:
      - v1
      security:
      - jwtAuth: []
      responses:
        '200':
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/CertificationPackage'
          description: ''
    put:
      operationId: v1_certification_packages_update
      parameters:
      - in: path
        name: id
        schema:
          type: integer
        description: A unique integer value identifying this certification package.
        required: true
      tags:
      - v1
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CertificationPackage'
          application/x-www-form-urlencoded:
            schema:
              $ref: '#/components/schemas/CertificationPackage'
          multipart/form-data:
            schema:
              $ref: '#/components/schemas/CertificationPackage'
        required: true
      security:
      - jwtAuth: []
      responses:
        '200':
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/CertificationPackage'
          description: ''
    patch:
      operationId: v1_certification_packages_partial_update
      parameters:
      - in: path
        name: id
        schema:
          type: integer
        description: A unique integer value identifying this certification package.
        required: true
      tags:
      - v1
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/PatchedCertificationPackage'
          application/x-www-form-urlencoded:
            schema:
              $ref: '#/components/schemas/PatchedCertificationPackage'
          multipart/form-data:
            schema:
              $ref: '#/components/schemas/PatchedCertificationPackage'
      security:
      - jwtAuth: []
      responses:
        '200':
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/CertificationPackage'
          description: ''
    delete:
      operationId: v1_certification_packages_destroy
      parameters:
      - in: path
        name: id
        schema:
          type: integer
        description: A unique integer value identifying this certification package.
        required: true
      tags:
      - v1
      security:
      - jwtAuth: []
      responses:
        '204':
          description: No response body
  /api/v1/certification/packages/{id}/add-line/:
    post:
      operationId: v1_certification_packages_add_line_create
      parameters:
      - in: path
        name: id
        schema:
          type: integer
        description: A unique integer value identifying this certification package.
        required: true
      tags:
      - v1
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CertificationPackage'
          application/x-www-form-urlencoded:
            schema:
              $ref: '#/components/schemas/CertificationPackage'
          multipart/form-data:
            schema:
              $ref: '#/components/schemas/CertificationPackage'
        required: true
      security:
      - jwtAuth: []
      responses:
        '200':
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/CertificationPackage'
          description: ''
  /api/v1/certification/packages/{id}/approve/:
    post:
      operationId: v1_certification_packages_approve_create
      parameters:
      - in: path
        name: id
        schema:
          type: integer
        description: A unique integer value identifying this certification package.
        required: true
      tags:
      - v1
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CertificationPackage'
          application/x-www-form-urlencoded:
            schema:
              $ref: '#/components/schemas/CertificationPackage'
          multipart/form-data:
            schema:
              $ref: '#/components/schemas/CertificationPackage'
        required: true
      security:
      - jwtAuth: []
      responses:
        '200':
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/CertificationPackage'
          description: ''
  /api/v1/certification/packages/{id}/certify/:
    post:
      operationId: v1_certification_packages_certify_create
      parameters:
      - in: path
        name: id
        schema:
          type: integer
        description: A unique integer value identifying this certification package.
        required: true
      tags:
      - v1
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CertificationPackage'
          application/x-www-form-urlencoded:
            schema:
              $ref: '#/components/schemas/CertificationPackage'
          multipart/form-data:
            schema:
              $ref: '#/components/schemas/CertificationPackage'
        required: true
      security:
      - jwtAuth: []
      responses:
        '200':
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/CertificationPackage'
          description: ''
  /api/v1/certification/packages/{id}/lock/:
    post:
      operationId: v1_certification_packages_lock_create
      parameters:
      - in: path
        name: id
        schema:
          type: integer
        description: A unique integer value identifying this certification package.
        required: true
      tags:
      - v1
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CertificationPackage'
          application/x-www-form-urlencoded:
            schema:
              $ref: '#/components/schemas/CertificationPackage'
          multipart/form-data:
            schema:
              $ref: '#/components/schemas/CertificationPackage'
        required: true
      security:
      - jwtAuth: []
      responses:
        '200':
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/CertificationPackage'
          description: ''
  /api/v1/certification/packages/{id}/submit/:
    post:
      operationId: v1_certification_packages_submit_create
      parameters:
      - in: path
        name: id
        schema:
          type: integer
        description: A unique integer value identifying this certification package.
        required: true
      tags:
      - v1
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CertificationPackage'
          application/x-www-form-urlencoded:
            schema:
              $ref: '#/components/schemas/CertificationPackage'
          multipart/form-data:
            schema:
              $ref: '#/components/schemas/CertificationPackage'
        required: true
      security:
      - jwtAuth: []
      responses:
        '200':
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/CertificationPackage'
          description: ''
  /api/v1/evidence/:
    get:
      operationId: v1_evidence_list
      description: Returns non-deleted evidence metadata. Supports project, pile,
        evidence type, verification status, and uploader filtering.
      summary: List evidence items
      parameters:
      - in: query
        name: evidence_type
        schema:
          type: string
          enum:
          - document
          - field_note
          - other
          - photo
          - video
        description: |-
          * `photo` - Photo
          * `video` - Video
          * `document` - Document
          * `field_note` - Field Note
          * `other` - Other
      - name: page
        required: false
        in: query
        description: A page number within the paginated result set.
        schema:
          type: integer
      - in: query
        name: project
        schema:
          type: integer
      - in: query
        name: uploaded_by
        schema:
          type: integer
      - in: query
        name: verification_status
        schema:
          type: string
          enum:
          - pending
          - rejected
          - verified
        description: |-
          * `pending` - Pending
          * `verified` - Verified
          * `rejected` - Rejected
      tags:
      - v1
      security:
      - jwtAuth: []
      responses:
        '200':
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/PaginatedEvidenceItemList'
          description: ''
  /api/v1/evidence/{id}/:
    get:
      operationId: v1_evidence_retrieve
      summary: Retrieve evidence item metadata
      parameters:
      - in: path
        name: id
        schema:
          type: integer
        description: A unique integer value identifying this evidence item.
        required: true
      tags:
      - v1
      security:
      - jwtAuth: []
      responses:
        '200':
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/EvidenceItem'
          description: ''
  /api/v1/evidence/{id}/link/:
    post:
      operationId: v1_evidence_link_create
      parameters:
      - in: path
        name: id
        schema:
          type: integer
        description: A unique integer value identifying this evidence item.
        required: true
      tags:
      - v1
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/EvidenceItem'
          application/x-www-form-urlencoded:
            schema:
              $ref: '#/components/schemas/EvidenceItem'
          multipart/form-data:
            schema:
              $ref: '#/components/schemas/EvidenceItem'
      security:
      - jwtAuth: []
      responses:
        '200':
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/EvidenceItem'
          description: ''
  /api/v1/evidence/{id}/verify/:
    post:
      operationId: v1_evidence_verify_create
      parameters:
      - in: path
        name: id
        schema:
          type: integer
        description: A unique integer value identifying this evidence item.
        required: true
      tags:
      - v1
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/EvidenceItem'
          application/x-www-form-urlencoded:
            schema:
              $ref: '#/components/schemas/EvidenceItem'
          multipart/form-data:
            schema:
              $ref: '#/components/schemas/EvidenceItem'
      security:
      - jwtAuth: []
      responses:
        '200':
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/EvidenceItem'
          description: ''
  /api/v1/evidence/upload/:
    post:
      operationId: v1_evidence_upload_create
      tags:
      - v1
      requestBody:
        content:
          multipart/form-data:
            schema:
              $ref: '#/components/schemas/EvidenceItem'
          application/x-www-form-urlencoded:
            schema:
              $ref: '#/components/schemas/EvidenceItem'
      security:
      - jwtAuth: []
      responses:
        '200':
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/EvidenceItem'
          description: ''
  /api/v1/execution/driving-records/:
    get:
      operationId: v1_execution_driving_records_list
      description: Returns execution records visible to the authenticated user.
      summary: List pile driving execution records
      parameters:
      - in: query
        name: execution_record__current_state
        schema:
          type: string
          enum:
          - APPROVED
          - CERTIFIED
          - DRAFT
          - LOCKED
          - REJECTED
          - RETURNED_FOR_CORRECTION
          - SUBMITTED
          - UNDER_REVIEW
        description: |-
          * `DRAFT` - Draft
          * `SUBMITTED` - Submitted
          * `UNDER_REVIEW` - Under Review
          * `APPROVED` - Approved
          * `RETURNED_FOR_CORRECTION` - Returned for Correction
          * `REJECTED` - Rejected
          * `CERTIFIED` - Certified
          * `LOCKED` - Locked
      - name: ordering
        required: false
        in: query
        description: Which field to use when ordering the results.
        schema:
          type: string
      - name: page
        required: false
        in: query
        description: A page number within the paginated result set.
        schema:
          type: integer
      - in: query
        name: pile
        schema:
          type: integer
      - in: query
        name: project
        schema:
          type: integer
      - name: search
        required: false
        in: query
        description: A search term.
        schema:
          type: string
      tags:
      - v1
      security:
      - jwtAuth: []
      responses:
        '200':
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/PaginatedPileDrivingRecordList'
          description: ''
    post:
      operationId: v1_execution_driving_records_create
      summary: Create a draft pile driving execution record
      tags:
      - v1
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/PileDrivingRecord'
          application/x-www-form-urlencoded:
            schema:
              $ref: '#/components/schemas/PileDrivingRecord'
          multipart/form-data:
            schema:
              $ref: '#/components/schemas/PileDrivingRecord'
        required: true
      security:
      - jwtAuth: []
      responses:
        '201':
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/PileDrivingRecord'
          description: ''
  /api/v1/execution/driving-records/{id}/:
    get:
      operationId: v1_execution_driving_records_retrieve
      summary: Retrieve a pile driving execution record
      parameters:
      - in: path
        name: id
        schema:
          type: integer
        description: A unique integer value identifying this pile driving record.
        required: true
      tags:
      - v1
      security:
      - jwtAuth: []
      responses:
        '200':
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/PileDrivingRecord'
          description: ''
    put:
      operationId: v1_execution_driving_records_update
      summary: Update a mutable draft or returned pile driving record
      parameters:
      - in: path
        name: id
        schema:
          type: integer
        description: A unique integer value identifying this pile driving record.
        required: true
      tags:
      - v1
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/PileDrivingRecord'
          application/x-www-form-urlencoded:
            schema:
              $ref: '#/components/schemas/PileDrivingRecord'
          multipart/form-data:
            schema:
              $ref: '#/components/schemas/PileDrivingRecord'
        required: true
      security:
      - jwtAuth: []
      responses:
        '200':
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/PileDrivingRecord'
          description: ''
        '409':
          description: Submitted records are immutable.
    patch:
      operationId: v1_execution_driving_records_partial_update
      summary: Partially update a mutable draft or returned pile driving record
      parameters:
      - in: path
        name: id
        schema:
          type: integer
        description: A unique integer value identifying this pile driving record.
        required: true
      tags:
      - v1
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/PatchedPileDrivingRecord'
          application/x-www-form-urlencoded:
            schema:
              $ref: '#/components/schemas/PatchedPileDrivingRecord'
          multipart/form-data:
            schema:
              $ref: '#/components/schemas/PatchedPileDrivingRecord'
      security:
      - jwtAuth: []
      responses:
        '200':
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/PileDrivingRecord'
          description: ''
        '409':
          description: Submitted records are immutable.
    delete:
      operationId: v1_execution_driving_records_destroy
      parameters:
      - in: path
        name: id
        schema:
          type: integer
        description: A unique integer value identifying this pile driving record.
        required: true
      tags:
      - v1
      security:
      - jwtAuth: []
      responses:
        '204':
          description: No response body
  /api/v1/execution/driving-records/{id}/revise/:
    post:
      operationId: v1_execution_driving_records_revise_create
      parameters:
      - in: path
        name: id
        schema:
          type: integer
        description: A unique integer value identifying this pile driving record.
        required: true
      tags:
      - v1
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/PileDrivingRecord'
          application/x-www-form-urlencoded:
            schema:
              $ref: '#/components/schemas/PileDrivingRecord'
          multipart/form-data:
            schema:
              $ref: '#/components/schemas/PileDrivingRecord'
        required: true
      security:
      - jwtAuth: []
      responses:
        '200':
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/PileDrivingRecord'
          description: ''
  /api/v1/execution/driving-records/{id}/submit/:
    post:
      operationId: v1_execution_driving_records_submit_create
      parameters:
      - in: path
        name: id
        schema:
          type: integer
        description: A unique integer value identifying this pile driving record.
        required: true
      tags:
      - v1
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/PileDrivingRecord'
          application/x-www-form-urlencoded:
            schema:
              $ref: '#/components/schemas/PileDrivingRecord'
          multipart/form-data:
            schema:
              $ref: '#/components/schemas/PileDrivingRecord'
        required: true
      security:
      - jwtAuth: []
      responses:
        '200':
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/PileDrivingRecord'
          description: ''
  /api/v1/piles/:
    get:
      operationId: v1_piles_list
      description: |-
        ViewSet for Pile CRUD + calculation operations.

        list: GET /api/v1/piles/
        create: POST /api/v1/piles/ (auto-calculates reinforcement)
        retrieve: GET /api/v1/piles/{id}/
        update: PUT /api/v1/piles/{id}/
        partial_update: PATCH /api/v1/piles/{id}/
        destroy: DELETE /api/v1/piles/{id}/

        Extra actions:
        POST /api/v1/piles/{id}/recalculate/ - Force recalculation
        GET /api/v1/piles/{id}/breakdown/ - Get detailed calculation breakdown
      parameters:
      - in: query
        name: diameter_mm
        schema:
          type: integer
      - name: ordering
        required: false
        in: query
        description: Which field to use when ordering the results.
        schema:
          type: string
      - name: page
        required: false
        in: query
        description: A page number within the paginated result set.
        schema:
          type: integer
      - in: query
        name: pile_type
        schema:
          type: string
          enum:
          - BORED
          - TYPE_I
          - TYPE_II
          - TYPE_III
        description: |-
          Pile type determines reinforcement configuration

          * `TYPE_I` - Type I
          * `TYPE_II` - Type II
          * `TYPE_III` - Type III
          * `BORED` - Type I - Bored
      - in: query
        name: project
        schema:
          type: integer
      - name: search
        required: false
        in: query
        description: A search term.
        schema:
          type: string
      tags:
      - v1
      security:
      - jwtAuth: []
      responses:
        '200':
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/PaginatedPileSummaryList'
          description: ''
    post:
      operationId: v1_piles_create
      description: |-
        ViewSet for Pile CRUD + calculation operations.

        list: GET /api/v1/piles/
        create: POST /api/v1/piles/ (auto-calculates reinforcement)
        retrieve: GET /api/v1/piles/{id}/
        update: PUT /api/v1/piles/{id}/
        partial_update: PATCH /api/v1/piles/{id}/
        destroy: DELETE /api/v1/piles/{id}/

        Extra actions:
        POST /api/v1/piles/{id}/recalculate/ - Force recalculation
        GET /api/v1/piles/{id}/breakdown/ - Get detailed calculation breakdown
      tags:
      - v1
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/PileCreateUpdate'
          application/x-www-form-urlencoded:
            schema:
              $ref: '#/components/schemas/PileCreateUpdate'
          multipart/form-data:
            schema:
              $ref: '#/components/schemas/PileCreateUpdate'
        required: true
      security:
      - jwtAuth: []
      responses:
        '201':
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/PileCreateUpdate'
          description: ''
  /api/v1/piles/{id}/:
    get:
      operationId: v1_piles_retrieve
      description: |-
        ViewSet for Pile CRUD + calculation operations.

        list: GET /api/v1/piles/
        create: POST /api/v1/piles/ (auto-calculates reinforcement)
        retrieve: GET /api/v1/piles/{id}/
        update: PUT /api/v1/piles/{id}/
        partial_update: PATCH /api/v1/piles/{id}/
        destroy: DELETE /api/v1/piles/{id}/

        Extra actions:
        POST /api/v1/piles/{id}/recalculate/ - Force recalculation
        GET /api/v1/piles/{id}/breakdown/ - Get detailed calculation breakdown
      parameters:
      - in: path
        name: id
        schema:
          type: integer
        description: A unique integer value identifying this Pile.
        required: true
      tags:
      - v1
      security:
      - jwtAuth: []
      responses:
        '200':
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/PileDetail'
          description: ''
    put:
      operationId: v1_piles_update
      description: |-
        ViewSet for Pile CRUD + calculation operations.

        list: GET /api/v1/piles/
        create: POST /api/v1/piles/ (auto-calculates reinforcement)
        retrieve: GET /api/v1/piles/{id}/
        update: PUT /api/v1/piles/{id}/
        partial_update: PATCH /api/v1/piles/{id}/
        destroy: DELETE /api/v1/piles/{id}/

        Extra actions:
        POST /api/v1/piles/{id}/recalculate/ - Force recalculation
        GET /api/v1/piles/{id}/breakdown/ - Get detailed calculation breakdown
      parameters:
      - in: path
        name: id
        schema:
          type: integer
        description: A unique integer value identifying this Pile.
        required: true
      tags:
      - v1
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/PileCreateUpdate'
          application/x-www-form-urlencoded:
            schema:
              $ref: '#/components/schemas/PileCreateUpdate'
          multipart/form-data:
            schema:
              $ref: '#/components/schemas/PileCreateUpdate'
        required: true
      security:
      - jwtAuth: []
      responses:
        '200':
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/PileCreateUpdate'
          description: ''
    patch:
      operationId: v1_piles_partial_update
      description: |-
        ViewSet for Pile CRUD + calculation operations.

        list: GET /api/v1/piles/
        create: POST /api/v1/piles/ (auto-calculates reinforcement)
        retrieve: GET /api/v1/piles/{id}/
        update: PUT /api/v1/piles/{id}/
        partial_update: PATCH /api/v1/piles/{id}/
        destroy: DELETE /api/v1/piles/{id}/

        Extra actions:
        POST /api/v1/piles/{id}/recalculate/ - Force recalculation
        GET /api/v1/piles/{id}/breakdown/ - Get detailed calculation breakdown
      parameters:
      - in: path
        name: id
        schema:
          type: integer
        description: A unique integer value identifying this Pile.
        required: true
      tags:
      - v1
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/PatchedPileCreateUpdate'
          application/x-www-form-urlencoded:
            schema:
              $ref: '#/components/schemas/PatchedPileCreateUpdate'
          multipart/form-data:
            schema:
              $ref: '#/components/schemas/PatchedPileCreateUpdate'
      security:
      - jwtAuth: []
      responses:
        '200':
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/PileCreateUpdate'
          description: ''
    delete:
      operationId: v1_piles_destroy
      description: |-
        ViewSet for Pile CRUD + calculation operations.

        list: GET /api/v1/piles/
        create: POST /api/v1/piles/ (auto-calculates reinforcement)
        retrieve: GET /api/v1/piles/{id}/
        update: PUT /api/v1/piles/{id}/
        partial_update: PATCH /api/v1/piles/{id}/
        destroy: DELETE /api/v1/piles/{id}/

        Extra actions:
        POST /api/v1/piles/{id}/recalculate/ - Force recalculation
        GET /api/v1/piles/{id}/breakdown/ - Get detailed calculation breakdown
      parameters:
      - in: path
        name: id
        schema:
          type: integer
        description: A unique integer value identifying this Pile.
        required: true
      tags:
      - v1
      security:
      - jwtAuth: []
      responses:
        '204':
          description: No response body
  /api/v1/piles/{id}/breakdown/:
    get:
      operationId: v1_piles_breakdown_retrieve
      description: |-
        Get detailed calculation breakdown for a pile.

        GET /api/v1/piles/{id}/breakdown/

        Returns full engineering breakdown including:
        - Main bar sections with lengths and weights
        - Helix turns and total length
        - Stiffener rings and spacing
        - Concrete volumes
      parameters:
      - in: path
        name: id
        schema:
          type: integer
        description: A unique integer value identifying this Pile.
        required: true
      tags:
      - v1
      security:
      - jwtAuth: []
      responses:
        '200':
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/PileDetail'
          description: ''
  /api/v1/piles/{id}/calculation-history/:
    get:
      operationId: v1_piles_calculation_history_retrieve
      description: |-
        Get immutable calculation history for a pile.

        GET /api/v1/piles/{id}/calculation-history/
      parameters:
      - in: path
        name: id
        schema:
          type: integer
        description: A unique integer value identifying this Pile.
        required: true
      tags:
      - v1
      security:
      - jwtAuth: []
      responses:
        '200':
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/PileDetail'
          description: ''
  /api/v1/piles/{id}/recalculate/:
    post:
      operationId: v1_piles_recalculate_create
      description: |-
        Force recalculation of pile quantities.

        POST /api/v1/piles/{id}/recalculate/

        Useful when pile type configuration has been updated
        and you need to refresh calculations.
      parameters:
      - in: path
        name: id
        schema:
          type: integer
        description: A unique integer value identifying this Pile.
        required: true
      tags:
      - v1
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/PileDetail'
          application/x-www-form-urlencoded:
            schema:
              $ref: '#/components/schemas/PileDetail'
          multipart/form-data:
            schema:
              $ref: '#/components/schemas/PileDetail'
        required: true
      security:
      - jwtAuth: []
      responses:
        '200':
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/PileDetail'
          description: ''
  /api/v1/piles/boq-export-csv/:
    get:
      operationId: v1_piles_boq_export_csv_retrieve
      description: Export Bill of Quantities (BOQ) as CSV.
      tags:
      - v1
      security:
      - jwtAuth: []
      responses:
        '200':
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/PileDetail'
          description: ''
  /api/v1/piles/boq-export-xlsx/:
    get:
      operationId: v1_piles_boq_export_xlsx_retrieve
      description: Export Bill of Quantities (BOQ) as Excel (.xlsx).
      tags:
      - v1
      security:
      - jwtAuth: []
      responses:
        '200':
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/PileDetail'
          description: ''
  /api/v1/piles/bulk-create/:
    post:
      operationId: v1_piles_bulk_create_create
      description: |-
        Bulk create piles with atomic transaction safety.
        Accepts a list of pile objects. All-or-nothing: if any row fails, none are created.
        Returns row-level validation errors.
      tags:
      - v1
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/PileDetail'
          application/x-www-form-urlencoded:
            schema:
              $ref: '#/components/schemas/PileDetail'
          multipart/form-data:
            schema:
              $ref: '#/components/schemas/PileDetail'
        required: true
      security:
      - jwtAuth: []
      responses:
        '200':
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/PileDetail'
          description: ''
  /api/v1/piles/configs/:
    get:
      operationId: v1_piles_configs_list
      description: |-
        ViewSet for PileTypeConfiguration (read-only).

        list: GET /api/v1/piles/configs/
        retrieve: GET /api/v1/piles/configs/{id}/
      parameters:
      - name: ordering
        required: false
        in: query
        description: Which field to use when ordering the results.
        schema:
          type: string
      - name: page
        required: false
        in: query
        description: A page number within the paginated result set.
        schema:
          type: integer
      - name: search
        required: false
        in: query
        description: A search term.
        schema:
          type: string
      tags:
      - v1
      security:
      - jwtAuth: []
      responses:
        '200':
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/PaginatedPileTypeConfigurationList'
          description: ''
  /api/v1/piles/configs/{pile_type}/:
    get:
      operationId: v1_piles_configs_retrieve
      description: |-
        ViewSet for PileTypeConfiguration (read-only).

        list: GET /api/v1/piles/configs/
        retrieve: GET /api/v1/piles/configs/{id}/
      parameters:
      - in: path
        name: pile_type
        schema:
          enum:
          - TYPE_I
          - TYPE_II
          - TYPE_III
          type: string
          description: |-
            Pile type identifier

            * `TYPE_I` - Type I
            * `TYPE_II` - Type II
            * `TYPE_III` - Type III
        required: true
      tags:
      - v1
      security:
      - jwtAuth: []
      responses:
        '200':
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/PileTypeConfiguration'
          description: ''
  /api/v1/piles/import-csv/:
    post:
      operationId: v1_piles_import_csv_create
      description: |-
        Import pile schedule from CSV. Bulk creates piles, returns row-level errors.
        Supports dry-run validation mode (no DB writes).
      tags:
      - v1
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/PileDetail'
          application/x-www-form-urlencoded:
            schema:
              $ref: '#/components/schemas/PileDetail'
          multipart/form-data:
            schema:
              $ref: '#/components/schemas/PileDetail'
        required: true
      security:
      - jwtAuth: []
      responses:
        '200':
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/PileDetail'
          description: ''
  /api/v1/projects/:
    get:
      operationId: v1_projects_list
      description: |-
        ViewSet for Project CRUD operations.

        list: GET /api/v1/projects/
        create: POST /api/v1/projects/
        retrieve: GET /api/v1/projects/{id}/
        update: PUT /api/v1/projects/{id}/
        partial_update: PATCH /api/v1/projects/{id}/
        destroy: DELETE /api/v1/projects/{id}/
      parameters:
      - name: ordering
        required: false
        in: query
        description: Which field to use when ordering the results.
        schema:
          type: string
      - name: page
        required: false
        in: query
        description: A page number within the paginated result set.
        schema:
          type: integer
      - name: search
        required: false
        in: query
        description: A search term.
        schema:
          type: string
      tags:
      - v1
      security:
      - jwtAuth: []
      responses:
        '200':
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/PaginatedProjectListList'
          description: ''
    post:
      operationId: v1_projects_create
      description: |-
        ViewSet for Project CRUD operations.

        list: GET /api/v1/projects/
        create: POST /api/v1/projects/
        retrieve: GET /api/v1/projects/{id}/
        update: PUT /api/v1/projects/{id}/
        partial_update: PATCH /api/v1/projects/{id}/
        destroy: DELETE /api/v1/projects/{id}/
      tags:
      - v1
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ProjectCreateUpdate'
          application/x-www-form-urlencoded:
            schema:
              $ref: '#/components/schemas/ProjectCreateUpdate'
          multipart/form-data:
            schema:
              $ref: '#/components/schemas/ProjectCreateUpdate'
        required: true
      security:
      - jwtAuth: []
      responses:
        '201':
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ProjectCreateUpdate'
          description: ''
  /api/v1/projects/{id}/:
    get:
      operationId: v1_projects_retrieve
      description: |-
        ViewSet for Project CRUD operations.

        list: GET /api/v1/projects/
        create: POST /api/v1/projects/
        retrieve: GET /api/v1/projects/{id}/
        update: PUT /api/v1/projects/{id}/
        partial_update: PATCH /api/v1/projects/{id}/
        destroy: DELETE /api/v1/projects/{id}/
      parameters:
      - in: path
        name: id
        schema:
          type: integer
        description: A unique integer value identifying this Project.
        required: true
      tags:
      - v1
      security:
      - jwtAuth: []
      responses:
        '200':
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ProjectDetail'
          description: ''
    put:
      operationId: v1_projects_update
      description: |-
        ViewSet for Project CRUD operations.

        list: GET /api/v1/projects/
        create: POST /api/v1/projects/
        retrieve: GET /api/v1/projects/{id}/
        update: PUT /api/v1/projects/{id}/
        partial_update: PATCH /api/v1/projects/{id}/
        destroy: DELETE /api/v1/projects/{id}/
      parameters:
      - in: path
        name: id
        schema:
          type: integer
        description: A unique integer value identifying this Project.
        required: true
      tags:
      - v1
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ProjectCreateUpdate'
          application/x-www-form-urlencoded:
            schema:
              $ref: '#/components/schemas/ProjectCreateUpdate'
          multipart/form-data:
            schema:
              $ref: '#/components/schemas/ProjectCreateUpdate'
        required: true
      security:
      - jwtAuth: []
      responses:
        '200':
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ProjectCreateUpdate'
          description: ''
    patch:
      operationId: v1_projects_partial_update
      description: |-
        ViewSet for Project CRUD operations.

        list: GET /api/v1/projects/
        create: POST /api/v1/projects/
        retrieve: GET /api/v1/projects/{id}/
        update: PUT /api/v1/projects/{id}/
        partial_update: PATCH /api/v1/projects/{id}/
        destroy: DELETE /api/v1/projects/{id}/
      parameters:
      - in: path
        name: id
        schema:
          type: integer
        description: A unique integer value identifying this Project.
        required: true
      tags:
      - v1
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/PatchedProjectCreateUpdate'
          application/x-www-form-urlencoded:
            schema:
              $ref: '#/components/schemas/PatchedProjectCreateUpdate'
          multipart/form-data:
            schema:
              $ref: '#/components/schemas/PatchedProjectCreateUpdate'
      security:
      - jwtAuth: []
      responses:
        '200':
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ProjectCreateUpdate'
          description: ''
    delete:
      operationId: v1_projects_destroy
      description: |-
        ViewSet for Project CRUD operations.

        list: GET /api/v1/projects/
        create: POST /api/v1/projects/
        retrieve: GET /api/v1/projects/{id}/
        update: PUT /api/v1/projects/{id}/
        partial_update: PATCH /api/v1/projects/{id}/
        destroy: DELETE /api/v1/projects/{id}/
      parameters:
      - in: path
        name: id
        schema:
          type: integer
        description: A unique integer value identifying this Project.
        required: true
      tags:
      - v1
      security:
      - jwtAuth: []
      responses:
        '204':
          description: No response body
  /api/v1/projects/{id}/boq/:
    get:
      operationId: v1_projects_boq_retrieve
      description: |-
        Generate Bill of Quantities for a project.

        GET /api/v1/projects/{id}/boq/

        Returns:
            - Summary by pile type (count, steel kg, concrete m3)
            - Per-pile detail
            - Grand totals
      parameters:
      - in: path
        name: id
        schema:
          type: integer
        description: A unique integer value identifying this Project.
        required: true
      tags:
      - v1
      security:
      - jwtAuth: []
      responses:
        '200':
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ProjectList'
          description: ''
  /api/v1/projects/{id}/boq-csv/:
    get:
      operationId: v1_projects_boq_csv_retrieve
      description: |-
        Export Bill of Quantities for a project as CSV.

        GET /api/v1/projects/{id}/boq-csv/
      parameters:
      - in: path
        name: id
        schema:
          type: integer
        description: A unique integer value identifying this Project.
        required: true
      tags:
      - v1
      security:
      - jwtAuth: []
      responses:
        '200':
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ProjectList'
          description: ''
  /api/v1/verification/flags/:
    get:
      operationId: v1_verification_flags_list
      parameters:
      - in: query
        name: category
        schema:
          type: string
          enum:
          - approval
          - blow_count
          - concrete
          - delay
          - depth
          - evidence
          - reinforcement
        description: |-
          * `depth` - Depth
          * `blow_count` - Blow Count
          * `concrete` - Concrete
          * `reinforcement` - Reinforcement
          * `evidence` - Evidence
          * `approval` - Approval
          * `delay` - Delay
      - name: page
        required: false
        in: query
        description: A page number within the paginated result set.
        schema:
          type: integer
      - in: query
        name: pile
        schema:
          type: integer
      - in: query
        name: project
        schema:
          type: integer
      - in: query
        name: severity
        schema:
          type: string
          enum:
          - critical
          - info
          - warning
        description: |-
          * `info` - Info
          * `warning` - Warning
          * `critical` - Critical
      - in: query
        name: status
        schema:
          type: string
          enum:
          - acknowledged
          - open
          - resolved
          - waived
        description: |-
          * `open` - Open
          * `acknowledged` - Acknowledged
          * `resolved` - Resolved
          * `waived` - Waived
      - in: query
        name: triggered_at
        schema:
          type: string
          format: date-time
      tags:
      - v1
      security:
      - jwtAuth: []
      responses:
        '200':
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/PaginatedVarianceFlagList'
          description: ''
  /api/v1/verification/flags/{id}/:
    get:
      operationId: v1_verification_flags_retrieve
      parameters:
      - in: path
        name: id
        schema:
          type: integer
        description: A unique integer value identifying this variance flag.
        required: true
      tags:
      - v1
      security:
      - jwtAuth: []
      responses:
        '200':
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/VarianceFlag'
          description: ''
  /api/v1/verification/flags/{id}/acknowledge/:
    post:
      operationId: v1_verification_flags_acknowledge_create
      parameters:
      - in: path
        name: id
        schema:
          type: integer
        description: A unique integer value identifying this variance flag.
        required: true
      tags:
      - v1
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/VarianceFlag'
          application/x-www-form-urlencoded:
            schema:
              $ref: '#/components/schemas/VarianceFlag'
          multipart/form-data:
            schema:
              $ref: '#/components/schemas/VarianceFlag'
      security:
      - jwtAuth: []
      responses:
        '200':
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/VarianceFlag'
          description: ''
  /api/v1/verification/flags/{id}/resolve/:
    post:
      operationId: v1_verification_flags_resolve_create
      parameters:
      - in: path
        name: id
        schema:
          type: integer
        description: A unique integer value identifying this variance flag.
        required: true
      tags:
      - v1
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/VarianceFlag'
          application/x-www-form-urlencoded:
            schema:
              $ref: '#/components/schemas/VarianceFlag'
          multipart/form-data:
            schema:
              $ref: '#/components/schemas/VarianceFlag'
      security:
      - jwtAuth: []
      responses:
        '200':
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/VarianceFlag'
          description: ''
  /api/v1/verification/flags/{id}/waive/:
    post:
      operationId: v1_verification_flags_waive_create
      parameters:
      - in: path
        name: id
        schema:
          type: integer
        description: A unique integer value identifying this variance flag.
        required: true
      tags:
      - v1
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/VarianceFlag'
          application/x-www-form-urlencoded:
            schema:
              $ref: '#/components/schemas/VarianceFlag'
          multipart/form-data:
            schema:
              $ref: '#/components/schemas/VarianceFlag'
      security:
      - jwtAuth: []
      responses:
        '200':
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/VarianceFlag'
          description: ''
  /api/v1/verification/run-checks/{execution_record_version_id}/:
    post:
      operationId: v1_verification_run_checks_create
      description: Runs deterministic rule-based verification against an immutable
        ExecutionRecordVersion snapshot. Re-running is idempotent and does not recreate
        duplicate flags.
      summary: Run verification checks
      parameters:
      - in: path
        name: execution_record_version_id
        schema:
          type: integer
        description: Immutable execution record version id.
        required: true
      tags:
      - v1
      security:
      - jwtAuth: []
      responses:
        '200':
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/RunVerificationChecksResponse'
          description: ''
components:
  schemas:
    ApprovalDecisionRequest:
      type: object
      properties:
        execution_record_version:
          type: integer
        comments:
          type: string
          default: ''
      required:
      - execution_record_version
    CategoryEnum:
      enum:
      - depth
      - blow_count
      - concrete
      - reinforcement
      - evidence
      - approval
      - delay
      type: string
      description: |-
        * `depth` - Depth
        * `blow_count` - Blow Count
        * `concrete` - Concrete
        * `reinforcement` - Reinforcement
        * `evidence` - Evidence
        * `approval` - Approval
        * `delay` - Delay
    CertificationLine:
      type: object
      properties:
        id:
          type: integer
          readOnly: true
        package:
          type: integer
          readOnly: true
        pile:
          type: integer
        pile_no:
          type: string
          readOnly: true
        source_execution_version:
          type: integer
        certified_depth_m:
          type: number
          format: double
          minimum: 0
        certified_concrete_m3:
          type: number
          format: double
          minimum: 0
        certified_reinforcement_kg:
          type: number
          format: double
          minimum: 0
        quantity_snapshot:
          readOnly: true
        certified_quantity:
          allOf:
          - $ref: '#/components/schemas/CertifiedQuantity'
          nullable: true
          readOnly: true
        created_at:
          type: string
          format: date-time
          readOnly: true
        updated_at:
          type: string
          format: date-time
          readOnly: true
      required:
      - certified_concrete_m3
      - certified_depth_m
      - certified_quantity
      - certified_reinforcement_kg
      - created_at
      - id
      - package
      - pile
      - pile_no
      - quantity_snapshot
      - source_execution_version
      - updated_at
    CertificationPackage:
      type: object
      properties:
        id:
          type: integer
          readOnly: true
        project:
          type: integer
        package_no:
          type: string
          maxLength: 80
        description:
          type: string
        current_state:
          allOf:
          - $ref: '#/components/schemas/CertificationPackageStateEnum'
          readOnly: true
        quantity_snapshot:
          readOnly: true
        created_by:
          type: integer
          readOnly: true
          nullable: true
        created_by_username:
          type: string
          readOnly: true
        submitted_by:
          type: integer
          readOnly: true
          nullable: true
        submitted_by_username:
          type: string
          readOnly: true
        submitted_at:
          type: string
          format: date-time
          readOnly: true
          nullable: true
        approved_by:
          type: integer
          readOnly: true
          nullable: true
        approved_by_username:
          type: string
          readOnly: true
        approved_at:
          type: string
          format: date-time
          readOnly: true
          nullable: true
        certified_by:
          type: integer
          readOnly: true
          nullable: true
        certified_by_username:
          type: string
          readOnly: true
        certified_at:
          type: string
          format: date-time
          readOnly: true
          nullable: true
        locked_at:
          type: string
          format: date-time
          readOnly: true
          nullable: true
        lines:
          type: array
          items:
            $ref: '#/components/schemas/CertificationLine'
          readOnly: true
        certified_quantities:
          type: array
          items:
            $ref: '#/components/schemas/CertifiedQuantity'
          readOnly: true
        created_at:
          type: string
          format: date-time
          readOnly: true
        updated_at:
          type: string
          format: date-time
          readOnly: true
      required:
      - approved_at
      - approved_by
      - approved_by_username
      - certified_at
      - certified_by
      - certified_by_username
      - certified_quantities
      - created_at
      - created_by
      - created_by_username
      - current_state
      - id
      - lines
      - locked_at
      - package_no
      - project
      - quantity_snapshot
      - submitted_at
      - submitted_by
      - submitted_by_username
      - updated_at
    CertificationPackageStateEnum:
      enum:
      - DRAFT
      - SUBMITTED
      - APPROVED
      - CERTIFIED
      - LOCKED
      type: string
      description: |-
        * `DRAFT` - Draft
        * `SUBMITTED` - Submitted
        * `APPROVED` - Approved
        * `CERTIFIED` - Certified
        * `LOCKED` - Locked
    CertifiedQuantity:
      type: object
      properties:
        id:
          type: integer
          readOnly: true
        package:
          type: integer
          readOnly: true
        certification_line:
          type: integer
          readOnly: true
        pile:
          type: integer
          readOnly: true
        pile_no:
          type: string
          readOnly: true
        source_execution_version:
          type: integer
          readOnly: true
        certified_depth_m:
          type: number
          format: double
          readOnly: true
        certified_concrete_m3:
          type: number
          format: double
          readOnly: true
        certified_reinforcement_kg:
          type: number
          format: double
          readOnly: true
        frozen_snapshot:
          readOnly: true
        certified_by:
          type: integer
          readOnly: true
          nullable: true
        certified_at:
          type: string
          format: date-time
          readOnly: true
      required:
      - certification_line
      - certified_at
      - certified_by
      - certified_concrete_m3
      - certified_depth_m
      - certified_reinforcement_kg
      - frozen_snapshot
      - id
      - package
      - pile
      - pile_no
      - source_execution_version
    ConsultantCommentRequest:
      type: object
      properties:
        execution_record_version:
          type: integer
        comment:
          type: string
      required:
      - comment
      - execution_record_version
    DrivingResistanceLog:
      type: object
      properties:
        id:
          type: integer
          readOnly: true
        sequence_no:
          type: integer
          maximum: 2147483647
          minimum: 0
        depth_from_m:
          type: number
          format: double
          minimum: 0
        depth_to_m:
          type: number
          format: double
          minimum: 0
        penetration_mm:
          type: number
          format: double
          minimum: 0
        blow_count:
          type: integer
          maximum: 2147483647
          minimum: 0
        set_per_blow:
          type: number
          format: double
          minimum: 0
          nullable: true
        notes:
          type: string
      required:
      - blow_count
      - depth_from_m
      - depth_to_m
      - id
      - penetration_mm
      - sequence_no
    EvidenceItem:
      type: object
      properties:
        id:
          type: integer
          readOnly: true
        project:
          type: integer
          readOnly: true
        uploaded_by:
          type: integer
          readOnly: true
          nullable: true
        uploaded_by_username:
          type: string
          readOnly: true
        file:
          type: string
          format: uri
          readOnly: true
        original_filename:
          type: string
          readOnly: true
        content_type:
          type: string
          readOnly: true
        file_size:
          type: integer
          readOnly: true
        sha256_hash:
          type: string
          readOnly: true
        uploaded_at:
          type: string
          format: date-time
          readOnly: true
        captured_at:
          type: string
          format: date-time
          readOnly: true
          nullable: true
        gps_lat:
          type: string
          format: decimal
          pattern: ^-?\d{0,3}(?:\.\d{0,6})?$
          readOnly: true
          nullable: true
        gps_lng:
          type: string
          format: decimal
          pattern: ^-?\d{0,3}(?:\.\d{0,6})?$
          readOnly: true
          nullable: true
        device_metadata:
          readOnly: true
        evidence_type:
          allOf:
          - $ref: '#/components/schemas/EvidenceTypeEnum'
          readOnly: true
        verification_status:
          allOf:
          - $ref: '#/components/schemas/VerificationStatusEnum'
          readOnly: true
        verified_by:
          type: integer
          readOnly: true
          nullable: true
        verified_by_username:
          type: string
          readOnly: true
        verified_at:
          type: string
          format: date-time
          readOnly: true
          nullable: true
        is_deleted:
          type: boolean
          readOnly: true
      required:
      - captured_at
      - content_type
      - device_metadata
      - evidence_type
      - file
      - file_size
      - gps_lat
      - gps_lng
      - id
      - is_deleted
      - original_filename
      - project
      - sha256_hash
      - uploaded_at
      - uploaded_by
      - uploaded_by_username
      - verification_status
      - verified_at
      - verified_by
      - verified_by_username
    EvidenceTypeEnum:
      enum:
      - photo
      - video
      - document
      - field_note
      - other
      type: string
      description: |-
        * `photo` - Photo
        * `video` - Video
        * `document` - Document
        * `field_note` - Field Note
        * `other` - Other
    ExecutionRecordVersion:
      type: object
      properties:
        id:
          type: integer
          readOnly: true
        version_no:
          type: integer
          readOnly: true
        submitted_by:
          type: integer
          readOnly: true
          nullable: true
        submitted_by_username:
          type: string
          readOnly: true
        submitted_at:
          type: string
          format: date-time
          readOnly: true
        data_snapshot:
          readOnly: true
        source_record_hash:
          type: string
          readOnly: true
        supersedes_version:
          type: integer
          readOnly: true
          nullable: true
      required:
      - data_snapshot
      - id
      - source_record_hash
      - submitted_at
      - submitted_by
      - submitted_by_username
      - supersedes_version
      - version_no
    PaginatedCertificationPackageList:
      type: object
      required:
      - count
      - results
      properties:
        count:
          type: integer
          example: 123
        next:
          type: string
          nullable: true
          format: uri
          example: http://api.example.org/accounts/?page=4
        previous:
          type: string
          nullable: true
          format: uri
          example: http://api.example.org/accounts/?page=2
        results:
          type: array
          items:
            $ref: '#/components/schemas/CertificationPackage'
    PaginatedEvidenceItemList:
      type: object
      required:
      - count
      - results
      properties:
        count:
          type: integer
          example: 123
        next:
          type: string
          nullable: true
          format: uri
          example: http://api.example.org/accounts/?page=4
        previous:
          type: string
          nullable: true
          format: uri
          example: http://api.example.org/accounts/?page=2
        results:
          type: array
          items:
            $ref: '#/components/schemas/EvidenceItem'
    PaginatedPileDrivingRecordList:
      type: object
      required:
      - count
      - results
      properties:
        count:
          type: integer
          example: 123
        next:
          type: string
          nullable: true
          format: uri
          example: http://api.example.org/accounts/?page=4
        previous:
          type: string
          nullable: true
          format: uri
          example: http://api.example.org/accounts/?page=2
        results:
          type: array
          items:
            $ref: '#/components/schemas/PileDrivingRecord'
    PaginatedPileSummaryList:
      type: object
      required:
      - count
      - results
      properties:
        count:
          type: integer
          example: 123
        next:
          type: string
          nullable: true
          format: uri
          example: http://api.example.org/accounts/?page=4
        previous:
          type: string
          nullable: true
          format: uri
          example: http://api.example.org/accounts/?page=2
        results:
          type: array
          items:
            $ref: '#/components/schemas/PileSummary'
    PaginatedPileTypeConfigurationList:
      type: object
      required:
      - count
      - results
      properties:
        count:
          type: integer
          example: 123
        next:
          type: string
          nullable: true
          format: uri
          example: http://api.example.org/accounts/?page=4
        previous:
          type: string
          nullable: true
          format: uri
          example: http://api.example.org/accounts/?page=2
        results:
          type: array
          items:
            $ref: '#/components/schemas/PileTypeConfiguration'
    PaginatedProjectListList:
      type: object
      required:
      - count
      - results
      properties:
        count:
          type: integer
          example: 123
        next:
          type: string
          nullable: true
          format: uri
          example: http://api.example.org/accounts/?page=4
        previous:
          type: string
          nullable: true
          format: uri
          example: http://api.example.org/accounts/?page=2
        results:
          type: array
          items:
            $ref: '#/components/schemas/ProjectList'
    PaginatedVarianceFlagList:
      type: object
      required:
      - count
      - results
      properties:
        count:
          type: integer
          example: 123
        next:
          type: string
          nullable: true
          format: uri
          example: http://api.example.org/accounts/?page=4
        previous:
          type: string
          nullable: true
          format: uri
          example: http://api.example.org/accounts/?page=2
        results:
          type: array
          items:
            $ref: '#/components/schemas/VarianceFlag'
    PatchedCertificationPackage:
      type: object
      properties:
        id:
          type: integer
          readOnly: true
        project:
          type: integer
        package_no:
          type: string
          maxLength: 80
        description:
          type: string
        current_state:
          allOf:
          - $ref: '#/components/schemas/CertificationPackageStateEnum'
          readOnly: true
        quantity_snapshot:
          readOnly: true
        created_by:
          type: integer
          readOnly: true
          nullable: true
        created_by_username:
          type: string
          readOnly: true
        submitted_by:
          type: integer
          readOnly: true
          nullable: true
        submitted_by_username:
          type: string
          readOnly: true
        submitted_at:
          type: string
          format: date-time
          readOnly: true
          nullable: true
        approved_by:
          type: integer
          readOnly: true
          nullable: true
        approved_by_username:
          type: string
          readOnly: true
        approved_at:
          type: string
          format: date-time
          readOnly: true
          nullable: true
        certified_by:
          type: integer
          readOnly: true
          nullable: true
        certified_by_username:
          type: string
          readOnly: true
        certified_at:
          type: string
          format: date-time
          readOnly: true
          nullable: true
        locked_at:
          type: string
          format: date-time
          readOnly: true
          nullable: true
        lines:
          type: array
          items:
            $ref: '#/components/schemas/CertificationLine'
          readOnly: true
        certified_quantities:
          type: array
          items:
            $ref: '#/components/schemas/CertifiedQuantity'
          readOnly: true
        created_at:
          type: string
          format: date-time
          readOnly: true
        updated_at:
          type: string
          format: date-time
          readOnly: true
    PatchedPileCreateUpdate:
      type: object
      description: |-
        Serializer for creating/updating piles with auto-calculation.

        On create: automatically runs calculation engine and stores results.
        On update: recalculates if pile_type, diameter, or lengths change.
      properties:
        id:
          type: integer
          readOnly: true
        pile_no:
          type: string
          description: Pile identifier, e.g., 'P-001', 'PILE 1 OF TYPE II'
          maxLength: 50
        pile_type:
          allOf:
          - $ref: '#/components/schemas/PileTypeEnum'
          description: |-
            Pile type determines reinforcement configuration

            * `TYPE_I` - Type I
            * `TYPE_II` - Type II
            * `TYPE_III` - Type III
            * `BORED` - Type I - Bored
        project:
          type: integer
        diameter_mm:
          type: integer
          maximum: 2000
          minimum: 200
          description: Pile diameter in mm
        design_length_m:
          type: number
          format: double
          maximum: 100.0
          minimum: 1.0
          description: Design length in meters
        actual_length_m:
          type: number
          format: double
          maximum: 100.0
          minimum: 1.0
          description: Actual installed length in meters
        piling_method:
          type: string
          description: Piling method, e.g., 'Driven Cast In-Situ'
          maxLength: 100
        concrete_grade:
          type: string
          description: Concrete grade, e.g., 'C35/40'
          maxLength: 20
        location_on_site:
          type: string
          description: Location on site
          maxLength: 200
        drawing_reference:
          type: string
          description: Drawing reference number
          maxLength: 100
        date_installed:
          type: string
          format: date
          nullable: true
          description: Date of installation
        notes:
          type: string
          description: Obstructions, remarks, test results
        calculation_result:
          type: object
          additionalProperties: {}
          readOnly: true
    PatchedPileDrivingRecord:
      type: object
      properties:
        id:
          type: integer
          readOnly: true
        execution_record:
          type: integer
          readOnly: true
        project:
          type: integer
        pile:
          type: integer
        current_state:
          type: string
          readOnly: true
        current_version_no:
          type: integer
          readOnly: true
        latest_version:
          allOf:
          - $ref: '#/components/schemas/ExecutionRecordVersion'
          readOnly: true
        start_time:
          type: string
          format: date-time
        end_time:
          type: string
          format: date-time
        reported_depth_m:
          type: number
          format: double
          minimum: 0
        verified_depth_m:
          type: number
          format: double
          minimum: 0
          nullable: true
        hammer_type:
          type: string
          maxLength: 100
        hammer_energy:
          type: string
          maxLength: 100
        final_set:
          type: string
          maxLength: 100
        total_blows:
          type: integer
          maximum: 2147483647
          minimum: 0
        remarks:
          type: string
        contractor_comments:
          type: string
        resistance_logs:
          type: array
          items:
            $ref: '#/components/schemas/DrivingResistanceLog'
        created_at:
          type: string
          format: date-time
          readOnly: true
        updated_at:
          type: string
          format: date-time
          readOnly: true
    PatchedProjectCreateUpdate:
      type: object
      description: Serializer for creating/updating projects.
      properties:
        id:
          type: integer
          readOnly: true
        name:
          type: string
          description: Project name, e.g., 'Lekki Phase 1'
          maxLength: 200
          minLength: 2
        location:
          type: string
          description: Project location, e.g., 'Lekki, Lagos'
          maxLength: 300
        client:
          type: string
          description: Client name
          maxLength: 200
        description:
          type: string
          description: Project description
        status:
          $ref: '#/components/schemas/ProjectStatusEnum'
        created_by:
          type: string
          description: Name of engineer who created the project
          maxLength: 100
    PileCalculation:
      type: object
      description: Serializer for calculated pile results.
      properties:
        main_bars_kg:
          type: number
          format: double
          description: Total main bar weight in kg
        helix_kg:
          type: number
          format: double
          description: Total helix/spiral weight in kg
        stiffeners_kg:
          type: number
          format: double
          description: Total stiffener ring weight in kg
        total_steel_kg:
          type: number
          format: double
          description: Grand total steel weight in kg
        total_tons:
          type: number
          format: double
          description: Convert kg to metric tons.
          readOnly: true
        design_concrete_m3:
          type: number
          format: double
          description: Concrete volume using design length
        actual_concrete_m3:
          type: number
          format: double
          description: Concrete volume using actual length
        calculation_version:
          type: string
          description: Version of calculation engine used
          maxLength: 20
        calculated_at:
          type: string
          format: date-time
          readOnly: true
      required:
      - calculated_at
      - total_tons
    PileCreateUpdate:
      type: object
      description: |-
        Serializer for creating/updating piles with auto-calculation.

        On create: automatically runs calculation engine and stores results.
        On update: recalculates if pile_type, diameter, or lengths change.
      properties:
        id:
          type: integer
          readOnly: true
        pile_no:
          type: string
          description: Pile identifier, e.g., 'P-001', 'PILE 1 OF TYPE II'
          maxLength: 50
        pile_type:
          allOf:
          - $ref: '#/components/schemas/PileTypeEnum'
          description: |-
            Pile type determines reinforcement configuration

            * `TYPE_I` - Type I
            * `TYPE_II` - Type II
            * `TYPE_III` - Type III
            * `BORED` - Type I - Bored
        project:
          type: integer
        diameter_mm:
          type: integer
          maximum: 2000
          minimum: 200
          description: Pile diameter in mm
        design_length_m:
          type: number
          format: double
          maximum: 100.0
          minimum: 1.0
          description: Design length in meters
        actual_length_m:
          type: number
          format: double
          maximum: 100.0
          minimum: 1.0
          description: Actual installed length in meters
        piling_method:
          type: string
          description: Piling method, e.g., 'Driven Cast In-Situ'
          maxLength: 100
        concrete_grade:
          type: string
          description: Concrete grade, e.g., 'C35/40'
          maxLength: 20
        location_on_site:
          type: string
          description: Location on site
          maxLength: 200
        drawing_reference:
          type: string
          description: Drawing reference number
          maxLength: 100
        date_installed:
          type: string
          format: date
          nullable: true
          description: Date of installation
        notes:
          type: string
          description: Obstructions, remarks, test results
        calculation_result:
          type: object
          additionalProperties: {}
          readOnly: true
      required:
      - actual_length_m
      - calculation_result
      - design_length_m
      - id
      - pile_no
      - pile_type
      - project
    PileDetail:
      type: object
      description: Full pile serializer with calculation breakdown.
      properties:
        id:
          type: integer
          readOnly: true
        pile_no:
          type: string
          description: Pile identifier, e.g., 'P-001', 'PILE 1 OF TYPE II'
          maxLength: 50
        pile_type:
          allOf:
          - $ref: '#/components/schemas/PileTypeEnum'
          description: |-
            Pile type determines reinforcement configuration

            * `TYPE_I` - Type I
            * `TYPE_II` - Type II
            * `TYPE_III` - Type III
            * `BORED` - Type I - Bored
        project:
          type: integer
        project_name:
          type: string
          readOnly: true
        diameter_mm:
          type: integer
          maximum: 2000
          minimum: 200
          description: Pile diameter in mm
        design_length_m:
          type: number
          format: double
          maximum: 100.0
          minimum: 1.0
          description: Design length in meters
        actual_length_m:
          type: number
          format: double
          maximum: 100.0
          minimum: 1.0
          description: Actual installed length in meters
        piling_method:
          type: string
          description: Piling method, e.g., 'Driven Cast In-Situ'
          maxLength: 100
        concrete_grade:
          type: string
          description: Concrete grade, e.g., 'C35/40'
          maxLength: 20
        location_on_site:
          type: string
          description: Location on site
          maxLength: 200
        drawing_reference:
          type: string
          description: Drawing reference number
          maxLength: 100
        date_installed:
          type: string
          format: date
          nullable: true
          description: Date of installation
        notes:
          type: string
          description: Obstructions, remarks, test results
        calculation:
          allOf:
          - $ref: '#/components/schemas/PileCalculation'
          readOnly: true
        created_at:
          type: string
          format: date-time
          readOnly: true
        updated_at:
          type: string
          format: date-time
          readOnly: true
      required:
      - actual_length_m
      - calculation
      - created_at
      - design_length_m
      - id
      - pile_no
      - pile_type
      - project
      - project_name
      - updated_at
    PileDrivingRecord:
      type: object
      properties:
        id:
          type: integer
          readOnly: true
        execution_record:
          type: integer
          readOnly: true
        project:
          type: integer
        pile:
          type: integer
        current_state:
          type: string
          readOnly: true
        current_version_no:
          type: integer
          readOnly: true
        latest_version:
          allOf:
          - $ref: '#/components/schemas/ExecutionRecordVersion'
          readOnly: true
        start_time:
          type: string
          format: date-time
        end_time:
          type: string
          format: date-time
        reported_depth_m:
          type: number
          format: double
          minimum: 0
        verified_depth_m:
          type: number
          format: double
          minimum: 0
          nullable: true
        hammer_type:
          type: string
          maxLength: 100
        hammer_energy:
          type: string
          maxLength: 100
        final_set:
          type: string
          maxLength: 100
        total_blows:
          type: integer
          maximum: 2147483647
          minimum: 0
        remarks:
          type: string
        contractor_comments:
          type: string
        resistance_logs:
          type: array
          items:
            $ref: '#/components/schemas/DrivingResistanceLog'
        created_at:
          type: string
          format: date-time
          readOnly: true
        updated_at:
          type: string
          format: date-time
          readOnly: true
      required:
      - created_at
      - current_state
      - current_version_no
      - end_time
      - execution_record
      - hammer_type
      - id
      - latest_version
      - pile
      - project
      - reported_depth_m
      - start_time
      - updated_at
    PileSummary:
      type: object
      description: Lightweight pile serializer for list views.
      properties:
        id:
          type: integer
          readOnly: true
        pile_no:
          type: string
          description: Pile identifier, e.g., 'P-001', 'PILE 1 OF TYPE II'
          maxLength: 50
        pile_type:
          allOf:
          - $ref: '#/components/schemas/PileTypeEnum'
          description: |-
            Pile type determines reinforcement configuration

            * `TYPE_I` - Type I
            * `TYPE_II` - Type II
            * `TYPE_III` - Type III
            * `BORED` - Type I - Bored
        diameter_mm:
          type: integer
          maximum: 2000
          minimum: 200
          description: Pile diameter in mm
        design_length_m:
          type: number
          format: double
          maximum: 100.0
          minimum: 1.0
          description: Design length in meters
        actual_length_m:
          type: number
          format: double
          maximum: 100.0
          minimum: 1.0
          description: Actual installed length in meters
        steel_kg:
          type: number
          format: double
          description: Get total steel weight, or 0 if no calculation.
          readOnly: true
        steel_tons:
          type: number
          format: double
          description: Convert kg to metric tons.
          readOnly: true
        concrete_m3:
          type: number
          format: double
          description: Get concrete volume, or 0 if no calculation.
          readOnly: true
        created_at:
          type: string
          format: date-time
          readOnly: true
      required:
      - actual_length_m
      - concrete_m3
      - created_at
      - design_length_m
      - id
      - pile_no
      - pile_type
      - steel_kg
      - steel_tons
    PileTypeConfiguration:
      type: object
      description: Serializer for pile type configuration.
      properties:
        id:
          type: integer
          readOnly: true
        pile_type:
          allOf:
          - $ref: '#/components/schemas/PileTypeConfigurationEnum'
          description: |-
            Pile type identifier

            * `TYPE_I` - Type I
            * `TYPE_II` - Type II
            * `TYPE_III` - Type III
        description:
          type: string
          description: Description of this pile type configuration
        main_bar_sections:
          description: List of main bar sections with size, length, count
        lap_length_m:
          type: number
          format: double
          minimum: 0
          description: Lap length in meters
        helix_bar_size_mm:
          type: integer
          maximum: 2147483647
          minimum: 0
          description: Helix/spiral bar diameter in mm (e.g., 8 for Y8)
        helix_pitch_mm:
          type: integer
          maximum: 2147483647
          minimum: 0
          description: Helix pitch/spacing in mm
        cage_diameter_mm:
          type: integer
          maximum: 2147483647
          minimum: 0
          description: Reinforcement cage diameter in mm
        helix_end_turns:
          type: integer
          maximum: 2147483647
          minimum: 0
          description: Extra end turns beyond design_length/pitch
        stiffener_bar_size_mm:
          type: integer
          maximum: 2147483647
          minimum: 0
          description: Stiffener ring bar diameter in mm
        stiffener_ring_diameter_mm:
          type: number
          format: double
          description: Stiffener ring centerline diameter in mm
        stiffener_spacing_m:
          type: number
          format: double
          minimum: 0.1
          description: Stiffener spacing along pile length in meters
        concrete_cover_mm:
          type: integer
          maximum: 2147483647
          minimum: 0
          description: Concrete cover to reinforcement in mm
        is_active:
          type: boolean
          description: Whether this configuration is active
        created_at:
          type: string
          format: date-time
          readOnly: true
        updated_at:
          type: string
          format: date-time
          readOnly: true
      required:
      - created_at
      - id
      - pile_type
      - updated_at
    PileTypeConfigurationEnum:
      enum:
      - TYPE_I
      - TYPE_II
      - TYPE_III
      type: string
      description: |-
        * `TYPE_I` - Type I
        * `TYPE_II` - Type II
        * `TYPE_III` - Type III
    PileTypeEnum:
      enum:
      - TYPE_I
      - TYPE_II
      - TYPE_III
      - BORED
      type: string
      description: |-
        * `TYPE_I` - Type I
        * `TYPE_II` - Type II
        * `TYPE_III` - Type III
        * `BORED` - Type I - Bored
    ProjectCreateUpdate:
      type: object
      description: Serializer for creating/updating projects.
      properties:
        id:
          type: integer
          readOnly: true
        name:
          type: string
          description: Project name, e.g., 'Lekki Phase 1'
          maxLength: 200
          minLength: 2
        location:
          type: string
          description: Project location, e.g., 'Lekki, Lagos'
          maxLength: 300
        client:
          type: string
          description: Client name
          maxLength: 200
        description:
          type: string
          description: Project description
        status:
          $ref: '#/components/schemas/ProjectStatusEnum'
        created_by:
          type: string
          description: Name of engineer who created the project
          maxLength: 100
      required:
      - id
      - name
    ProjectDetail:
      type: object
      description: Full serializer with pile breakdown.
      properties:
        id:
          type: integer
          readOnly: true
        name:
          type: string
          description: Project name, e.g., 'Lekki Phase 1'
          maxLength: 200
          minLength: 2
        location:
          type: string
          description: Project location, e.g., 'Lekki, Lagos'
          maxLength: 300
        client:
          type: string
          description: Client name
          maxLength: 200
        status:
          $ref: '#/components/schemas/ProjectStatusEnum'
        total_piles:
          type: integer
          description: Return annotated pile count when available.
          readOnly: true
        total_steel_kg:
          type: number
          format: double
          description: Return annotated steel total when available.
          readOnly: true
        total_steel_tons:
          type: number
          format: double
          description: Convert kg to metric tons.
          readOnly: true
        total_concrete_m3:
          type: number
          format: double
          description: Return annotated concrete total when available.
          readOnly: true
        created_at:
          type: string
          format: date-time
          readOnly: true
        updated_at:
          type: string
          format: date-time
          readOnly: true
        description:
          type: string
          description: Project description
        created_by:
          type: string
          description: Name of engineer who created the project
          maxLength: 100
        piles:
          type: array
          items:
            type: object
            additionalProperties: {}
          readOnly: true
      required:
      - created_at
      - id
      - name
      - piles
      - total_concrete_m3
      - total_piles
      - total_steel_kg
      - total_steel_tons
      - updated_at
    ProjectList:
      type: object
      description: Lightweight serializer for project list views.
      properties:
        id:
          type: integer
          readOnly: true
        name:
          type: string
          description: Project name, e.g., 'Lekki Phase 1'
          maxLength: 200
          minLength: 2
        location:
          type: string
          description: Project location, e.g., 'Lekki, Lagos'
          maxLength: 300
        client:
          type: string
          description: Client name
          maxLength: 200
        status:
          $ref: '#/components/schemas/ProjectStatusEnum'
        total_piles:
          type: integer
          description: Return annotated pile count when available.
          readOnly: true
        total_steel_kg:
          type: number
          format: double
          description: Return annotated steel total when available.
          readOnly: true
        total_steel_tons:
          type: number
          format: double
          description: Convert kg to metric tons.
          readOnly: true
        total_concrete_m3:
          type: number
          format: double
          description: Return annotated concrete total when available.
          readOnly: true
        created_at:
          type: string
          format: date-time
          readOnly: true
        updated_at:
          type: string
          format: date-time
          readOnly: true
      required:
      - created_at
      - id
      - name
      - total_concrete_m3
      - total_piles
      - total_steel_kg
      - total_steel_tons
      - updated_at
    ProjectStatusEnum:
      enum:
      - ACTIVE
      - ON_HOLD
      - COMPLETED
      - CANCELLED
      type: string
      description: |-
        * `ACTIVE` - Active
        * `ON_HOLD` - On Hold
        * `COMPLETED` - Completed
        * `CANCELLED` - Cancelled
    RunVerificationChecksResponse:
      type: object
      properties:
        execution_record_version:
          type: integer
        flags:
          type: array
          items:
            $ref: '#/components/schemas/VarianceFlag'
      required:
      - execution_record_version
      - flags
    SeverityEnum:
      enum:
      - info
      - warning
      - critical
      type: string
      description: |-
        * `info` - Info
        * `warning` - Warning
        * `critical` - Critical
    TokenObtainPair:
      type: object
      properties:
        username:
          type: string
          writeOnly: true
        password:
          type: string
          writeOnly: true
        access:
          type: string
          readOnly: true
        refresh:
          type: string
          readOnly: true
      required:
      - access
      - password
      - refresh
      - username
    TokenRefresh:
      type: object
      properties:
        access:
          type: string
          readOnly: true
        refresh:
          type: string
          writeOnly: true
      required:
      - access
      - refresh
    VarianceFlag:
      type: object
      properties:
        id:
          type: integer
          readOnly: true
        project:
          type: integer
          readOnly: true
        pile:
          type: integer
          readOnly: true
        execution_record_version:
          type: integer
          readOnly: true
        category:
          allOf:
          - $ref: '#/components/schemas/CategoryEnum'
          readOnly: true
        severity:
          allOf:
          - $ref: '#/components/schemas/SeverityEnum'
          readOnly: true
        status:
          allOf:
          - $ref: '#/components/schemas/VarianceStatusEnum'
          readOnly: true
        expected_value:
          type: string
          readOnly: true
        reported_value:
          type: string
          readOnly: true
        verified_value:
          type: string
          readOnly: true
        message:
          type: string
          readOnly: true
        rule_code:
          type: string
          readOnly: true
        triggered_at:
          type: string
          format: date-time
          readOnly: true
        resolved_at:
          type: string
          format: date-time
          readOnly: true
          nullable: true
        resolved_by:
          type: integer
          readOnly: true
          nullable: true
        resolved_by_username:
          type: string
          readOnly: true
        resolution_comment:
          type: string
          readOnly: true
        action_logs:
          type: array
          items:
            $ref: '#/components/schemas/VerificationActionLog'
          readOnly: true
      required:
      - action_logs
      - category
      - execution_record_version
      - expected_value
      - id
      - message
      - pile
      - project
      - reported_value
      - resolution_comment
      - resolved_at
      - resolved_by
      - resolved_by_username
      - rule_code
      - severity
      - status
      - triggered_at
      - verified_value
    VarianceStatusEnum:
      enum:
      - open
      - acknowledged
      - resolved
      - waived
      type: string
      description: |-
        * `open` - Open
        * `acknowledged` - Acknowledged
        * `resolved` - Resolved
        * `waived` - Waived
    VerificationActionLog:
      type: object
      properties:
        id:
          type: integer
          readOnly: true
        actor:
          type: integer
          readOnly: true
          nullable: true
        actor_username:
          type: string
          readOnly: true
        action:
          type: string
          readOnly: true
        previous_status:
          type: string
          readOnly: true
        new_status:
          type: string
          readOnly: true
        comment:
          type: string
          readOnly: true
        created_at:
          type: string
          format: date-time
          readOnly: true
      required:
      - action
      - actor
      - actor_username
      - comment
      - created_at
      - id
      - new_status
      - previous_status
    VerificationStatusEnum:
      enum:
      - pending
      - verified
      - rejected
      type: string
      description: |-
        * `pending` - Pending
        * `verified` - Verified
        * `rejected` - Rejected
  securitySchemes:
    jwtAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
