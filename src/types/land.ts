export interface LandResourceItem {
  landId: number;
  landCode?: string;
  areaId?: number;
  areaName?: string;
  areaSize?: number;
  soilType?: string;
  status?: string;
  location?: string;
  description?: string;
  createdAt?: string;
}

export interface LandItem {
  landId: number;
  landCode?: string;
  landName?: string;
  areaId?: number;
  areaName?: string;
  areaSize?: number;
  area?: number;
  soilType?: string;
  status?: string;
  location?: string;
  description?: string;
  createdAt?: string;
}

export interface LandRequest {
  landCode: string;
  areaId: number;
  areaSize: number;
  soilType: string;
  status?: string;
  location?: string;
  description?: string;
}
