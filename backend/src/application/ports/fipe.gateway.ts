export const FIPE_GATEWAY = Symbol('FIPE_GATEWAY');

export interface FipePrice {
  valor: string;
  marca: string;
  modelo: string;
  anoModelo: number;
  combustivel: string;
  codigoFipe: string;
  mesReferencia: string;
  tipoVeiculo: number;
  siglaCombustivel: string;
  dataConsulta: string;
}

export interface FipeGateway {
  getPrices(code: string): Promise<FipePrice[]>;
}
