export class TcpRequest<T> {
  processId?: string;
  data?: T;

  constructor(data: Partial<TcpRequest<T>>) {
    Object.assign(this, data);
  }
}
