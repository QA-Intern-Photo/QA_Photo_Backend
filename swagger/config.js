export const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "최애의 포토 API 명세서",
      version: "1.0.0"
    }
  },
  apis: ["./swagger/*.js"] // files containing annotations as above
};
