# syntax=docker/dockerfile:1.7

# ============================================================
# Stage 1: Build executable Spring Boot JAR
# ============================================================
FROM maven:3.9.16-eclipse-temurin-21-noble AS build

WORKDIR /workspace

COPY pom.xml ./

RUN --mount=type=cache,target=/root/.m2,sharing=locked \
    mvn -B -ntp dependency:go-offline -DskipTests

COPY src ./src

RUN --mount=type=cache,target=/root/.m2,sharing=locked \
    mvn -B -ntp package -DskipTests && \
    set -- $(find target \
        -maxdepth 1 \
        -type f \
        -name '*.jar' \
        ! -name '*-sources.jar' \
        ! -name '*-javadoc.jar' \
        ! -name '*.original'); \
    if [ "$#" -ne 1 ]; then \
        echo "Expected exactly one executable JAR, found: $#" >&2; \
        find target -maxdepth 1 -type f -name '*.jar' -print >&2; \
        exit 1; \
    fi && \
    cp "$1" /workspace/application.jar && \
    test -s /workspace/application.jar


# ============================================================
# Stage 2: Production runtime
# ============================================================
FROM eclipse-temurin:21-jre-noble AS runtime

LABEL maintainer="nghlong3004"
LABEL description="Olympic Platform API"

WORKDIR /app

RUN groupadd --gid 10001 olympic_platform && \
    useradd \
        --uid 10001 \
        --gid 10001 \
        --no-create-home \
        --home-dir /app \
        --shell /usr/sbin/nologin \
        olympic_platform && \
    mkdir -p /app/storage /tmp/olympic_platform && \
    chown -R olympic_platform:olympic_platform /app/storage /tmp/olympic_platform

COPY --from=build --chown=olympic_platform:olympic_platform \
    /workspace/application.jar \
    /app/application.jar

RUN test -s /app/application.jar

USER 10001:10001

EXPOSE 8080

ENV HOME=/app

ENV JAVA_TOOL_OPTIONS="\
-XX:MaxRAMPercentage=70.0 \
-XX:+ExitOnOutOfMemoryError \
-Djava.io.tmpdir=/tmp/olympic_platform"

ENTRYPOINT ["java", "-jar", "/app/application.jar"]