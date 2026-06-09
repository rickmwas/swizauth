import { NextResponse } from 'next/server';

export interface HealthResponse {
  status: string;
  timestamp: string;
  service: string;
  version: string;
}

export async function GET(): Promise<NextResponse<HealthResponse>> {
  const response: HealthResponse = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'dashboard',
    version: '1.0.0',
  };

  return NextResponse.json(response);
}