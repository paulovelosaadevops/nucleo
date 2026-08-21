FROM eclipse-temurin:17-jdk-alpine AS builder

WORKDIR /workspace

COPY .mvn .mvn
COPY mvnw mvnw
COPY pom.xml pom.xml

RUN chmod +x mvnw \
    && ./mvnw \
        --batch-mode \
        --no-transfer-progress \
        -DskipTests \
        dependency:go-offline

COPY src src

RUN ./mvnw \
        --batch-mode \
        --no-transfer-progress \
        -DskipTests \
        clean package \
    && JAR_FILE="$(find target \
        -maxdepth 1 \
        -type f \
        -name '*.jar' \
        ! -name '*.original' \
        | head -n 1)" \
    && test -n "$JAR_FILE" \
    && cp "$JAR_FILE" target/application.jar


FROM eclipse-temurin:17-jre-alpine AS runtime

RUN apk add --no-cache curl \
    && addgroup \
        --system \
        --gid 1001 \
        nucleo \
    && adduser \
        --system \
        --uid 1001 \
        --ingroup nucleo \
        --home /app \
        nucleo

WORKDIR /app

COPY \
    --from=builder \
    --chown=nucleo:nucleo \
    /workspace/target/application.jar \
    /app/application.jar

USER nucleo

EXPOSE 8090

ENV JAVA_OPTS="-XX:MaxRAMPercentage=75.0 -XX:+UseG1GC -Dfile.encoding=UTF-8 -Duser.timezone=UTC"

ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar /app/application.jar"]