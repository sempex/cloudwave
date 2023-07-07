export default function decodeObjectValues(obj: { [key: string]: string }) {
  const decodedObj: { [key: string]: string } = {};

  for (const key in obj) {
    const encodedValue = obj[key];
    const decodedValue = atob(encodedValue);
    decodedObj[key] = decodedValue;
  }

  return decodedObj;
}
