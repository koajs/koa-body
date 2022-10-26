import { HttpMethodEnum } from '../types';

export default function toHttpMethod(method: string): HttpMethodEnum {
  return HttpMethodEnum[method as keyof typeof HttpMethodEnum];
}
