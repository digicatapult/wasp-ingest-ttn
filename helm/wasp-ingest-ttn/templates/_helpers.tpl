{{/*
Create name to be used with deployment.
*/}}
{{- define "wasp-ingest-ttn.fullname" -}}
  {{- if .Values.fullnameOverride -}}
      {{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" -}}
  {{- else -}}
    {{- $name := default .Chart.Name .Values.nameOverride -}}
    {{- if contains $name .Release.Name -}}
      {{- .Release.Name | trunc 63 | trimSuffix "-" -}}
    {{- else -}}
      {{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" -}}
    {{- end -}}
  {{- end -}}
{{- end -}}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "wasp-ingest-ttn.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "wasp-ingest-ttn.selectorLabels" -}}
app.kubernetes.io/name: {{ include "wasp-ingest-ttn.fullname" . }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "wasp-ingest-ttn.labels" -}}
helm.sh/chart: {{ include "wasp-ingest-ttn.chart" . }}
{{ include "wasp-ingest-ttn.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Conditionally populate imagePullSecrets if present in the context
*/}}
{{- define "wasp-ingest-ttn.imagePullSecrets" -}}
  {{- if (not (empty .Values.image.pullSecrets)) }}
imagePullSecrets:
    {{- range .Values.image.pullSecrets }}
  - name: {{ . }}
    {{- end }}
  {{- end }}
{{- end -}}

{{/*
Gets the things service name based on values
if the mock is enabled we'll allow the name to be set by the logic in the nginx chart
if the mock is disabled then just use the name provided in the init config
*/}}
{{- define "wasp-ingest-ttn.thing-service-name" -}}
  {{- if .Values.waspthingmock.enabled -}}
    {{- if .Values.waspthingmock.fullnameOverride -}}
      {{- .Values.waspthingmock.fullnameOverride | trunc 63 | trimSuffix "-" -}}
    {{- else -}}
      {{- $name := default "waspthingmock" .Values.waspthingmock.nameOverride -}}
      {{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" -}}
    {{- end -}}
  {{- else -}}
    {{- .Values.config.init.thingServiceName -}}
  {{- end -}}
{{- end -}}

{{/*
Conditionally populate initContainers
*/}}
{{- define "wasp-ingest-ttn.initContainers" }}
initContainers:
{{ $name := include "wasp-ingest-ttn.fullname" . }}
  - name: {{ printf "%s-wait-deps" $name | trunc 63 | trimSuffix "-" }}
    image: busybox:1.28
    command:
      - 'sh'
      - '-c'
      - 'until nslookup $THING_NAME.$(cat /var/run/secrets/kubernetes.io/serviceaccount/namespace).svc.cluster.local; do echo waiting for wasp-thing-service; sleep 2; done'
    env:
      - name: THING_NAME
        value: {{ include "wasp-ingest-ttn.thing-service-name" . }}
  - name: {{ printf "%s-register" $name | trunc 63 | trimSuffix "-" }}
    image: curlimages/curl:7.75.0
    command:
      - 'sh'
      - '-c'
      - 'echo "Asserting ingest $INGEST_NAME"; code=$(curl -s -o /dev/null -w "%{http_code}" -X POST -H "Content-Type:application/json" http://$THING_NAME:$THINGS_PORT/v1/ingest -d "{ \"name\": \"$INGEST_NAME\" }"); echo "Assertion result: $code"; case $code in 201|409) exit 0 ;; *) exit 1 ;; esac;'
    env:
      - name: THING_NAME
        value: {{ include "wasp-ingest-ttn.thing-service-name" . }}
      - name: THINGS_PORT
        value: {{ .Values.config.init.thingServicePort | quote }}
      - name: INGEST_NAME
        value: {{ .Values.config.waspIngestName }}
{{ end -}}

{{/*
Create a default fully qualified redis name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
*/}}
{{- define "wasp-ingest-ttn.redis.fullname" -}}
{{- if .Values.config.externalRedis -}}
{{ .Values.config.externalRedis | trunc 63 | trimSuffix "-" -}}
{{- else if not ( .Values.redis.enabled ) -}}
{{ fail "Redis must either be enabled or passed via config.externalRedis" }}
{{- else if .Values.redis.fullnameOverride -}}
{{- .Values.redis.fullnameOverride | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- $name := default "redis-master" .Values.redis.nameOverride -}}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" -}}
{{- end -}}
{{- end -}}

{{/*
If no redis username is provided then give "default"
*/}}
{{- define "wasp-ingest-ttn.redis.username" -}}
{{- if .Values.config.redisUsername -}}
{{ .Values.config.redisUsername | quote -}}
{{- else -}}
"default"
{{- end -}}
{{- end -}}

{{/*
Create a default fully qualified mqtt-broker name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
*/}}
{{- define "wasp-ingest-ttn.mqttBroker.endpoint" -}}
{{- if .Values.config.ttnMqttEndpoint -}}
{{ .Values.config.ttnMqttEndpoint | trunc 63 | trimSuffix "-" -}}
{{- else if not ( .Values.mosquitto.enabled ) -}}
{{ fail "An MQTT broker must either be configured or a mosquitto instance enabled" }}
{{- else if .Values.mosquitto.fullnameOverride -}}
{{- printf "mqtt://%s:1883" .Values.mosquitto.fullnameOverride -}}
{{- else -}}
{{- $name := default "mosquitto" .Values.mosquitto.nameOverride -}}
{{- printf "mqtt://%s-%s:1883" .Release.Name $name | trunc 63 | trimSuffix "-" -}}
{{- end -}}
{{- end -}}

{{/*
Create a default fully qualified kafka broker name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
*/}}
{{- define "wasp-ingest-ttn.kafka.brokers" -}}
{{- if .Values.config.kafkaBrokers -}}
{{ .Values.config.kafkaBrokers | trunc 63 | trimSuffix "-" -}}
{{- else if not ( .Values.kafka.enabled ) -}}
{{ fail "Kafka brokers must either be configured or a kafka instance enabled" }}
{{- else if .Values.kafka.fullnameOverride -}}
{{- printf "%s:9092" .Values.kafka.fullnameOverride -}}
{{- else -}}
{{- $name := default "kafka" .Values.kafka.nameOverride -}}
{{- printf "%s-%s:9092" .Release.Name $name | trunc 63 | trimSuffix "-" -}}
{{- end -}}
{{- end -}}
