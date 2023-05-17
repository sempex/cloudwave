export default function statusRes(
  status: "success" | "error",
  message: string,
  data?: any
) {
  return {
    status,
    message,
    data,
  };
}
