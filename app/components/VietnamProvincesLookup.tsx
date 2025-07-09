'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Search, MapPin, Users, BarChart3, Building, X, ChevronRight, Map, TrendingUp, Eye, Database, Info, Grid3X3, List, Target } from 'lucide-react';

// Interface cho dữ liệu tỉnh thành từ API
interface ProvinceData {
  name: string;
  official_name: string;
  administrative_center: string;
  merged_provinces: string[];
  merger_type: string;
  province_code: string;
  short_code: string;
  short_name: string;
  place_type: string;
  has_detail: boolean;
  ward_count: number;
  merger_count: number;
  non_merger_count: number;
  total_old_units: number;
  wards_with_code: number;
  merger_rate: number;
  code_rate: number;
}

// Interface cho dữ liệu đơn vị hành chính chi tiết
interface LocationItem {
  id: number;
  matinh: number;
  ma: string;
  tentinh: string;
  loai: string;
  tenhc: string;
  dientichkm2: number;
  dansonguoi: string;
  trungtamhc: string;
  kinhdo: number;
  vido: number;
  truocsapnhap: string;
}

const VietnamProvincesLookup = () => {
  const [mounted, setMounted] = useState(false);
  const [provinces, setProvinces] = useState<ProvinceData[]>([]);
  const [selectedProvince, setSelectedProvince] = useState<ProvinceData | null>(null);
  const [mainSearchTerm, setMainSearchTerm] = useState<string>('');
  const [modalSearchTerm, setModalSearchTerm] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedItem, setSelectedItem] = useState<LocationItem | null>(null);
  const [detailData, setDetailData] = useState<LocationItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [detailLoading, setDetailLoading] = useState<boolean>(false);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [provinceFilter, setProvinceFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'name' | 'wards' | 'merger_rate'>('name');

  // Cleanup khi component unmount
  useEffect(() => {
    return () => {
      // Đảm bảo body scroll được enable lại khi component unmount
      document.body.style.overflow = 'unset';
    };
  }, []);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
    loadProvinces();
  }, []);

  const loadProvinces = async () => {
    setLoading(true);
    try {
      const response = await fetch('https://don-vi-hanh-chinh.vercel.app/api/provinces');
      const result = await response.json();
      
      if (result.success && Array.isArray(result.data)) {
        setProvinces(result.data);
      } else if (Array.isArray(result)) {
        setProvinces(result);
      } else {
        console.error('API response structure unexpected:', result);
        setProvinces([]);
      }
    } catch (error) {
      console.error('Error loading provinces:', error);
      setProvinces([]);
    }
    setLoading(false);
  };

  const loadProvinceDetail = async (province: ProvinceData) => {
    setDetailLoading(true);
    setDetailData([]);
    setSelectedItem(null);
    
    try {
      if (province.has_detail) {
        let jsonData: LocationItem[] = [];
        // Import JSON từ thư mục src/data
        if (province.short_code === "VLG" || province.name.includes("Vĩnh Long")) {
          const response = await fetch('/data/vinhlong.json');
          jsonData = await response.json();
        } else if (province.short_code === "CTO" || province.name.includes("Cần Thơ")) {
          const response = await fetch('/data/cantho.json');
          jsonData = await response.json();
        } else if (province.short_code === "CMU" || province.name.includes("Cà Mau")) {
          const response = await fetch('/data/camau.json');
          jsonData = await response.json();
        } else if (province.short_code === "AGG" || province.name.includes("An Giang")) {
          const response = await fetch('/data/angiang.json');
          jsonData = await response.json();
        } else if (province.short_code === "DTP" || province.name.includes("Đồng Tháp")) {
          const response = await fetch('/data/dongthap.json');
          jsonData = await response.json();
        }
        if (Array.isArray(jsonData)) {
          setDetailData(jsonData);
        }
      }
    } catch (error) {
      console.error('Error loading province detail:', error);
      setDetailData([]);
    }
    setDetailLoading(false);
  };

  const handleProvinceClick = (province: ProvinceData) => {
    // Chỉ mở modal nếu tỉnh có dữ liệu chi tiết VÀ có sáp nhập
    if (province.has_detail && province.merger_type === "Có sáp nhập") {
      setSelectedProvince(province);
      setShowModal(true);
      loadProvinceDetail(province);
      // Disable scroll cho body khi modal mở
      document.body.style.overflow = 'hidden';
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedProvince(null);
    setDetailData([]);
    setSelectedItem(null);
    setModalSearchTerm('');
    setSelectedType('all');
    // Enable scroll lại cho body
    document.body.style.overflow = 'unset';
  };

  // Sort provinces
  const sortedProvinces = useMemo(() => {
    if (!mounted || !Array.isArray(provinces) || provinces.length === 0) {
      return [];
    }
    
    const sorted = [...provinces].sort((a, b) => {
      switch (sortBy) {
        case 'wards':
          return (b.ward_count || 0) - (a.ward_count || 0);
        case 'merger_rate':
          return (b.merger_rate || 0) - (a.merger_rate || 0);
        default:
          return a.name.localeCompare(b.name, 'vi');
      }
    });
    
    return sorted;
  }, [provinces, sortBy, mounted]);

  // Filter provinces
  const filteredProvinces = useMemo(() => {
    return sortedProvinces.filter(province => {
      const matchesSearch = province.name?.toLowerCase().includes(mainSearchTerm.toLowerCase()) ||
                           province.short_code?.toLowerCase().includes(mainSearchTerm.toLowerCase());
      const matchesType = provinceFilter === 'all' || province.place_type === provinceFilter;
      return matchesSearch && matchesType;
    });
  }, [sortedProvinces, mainSearchTerm, provinceFilter]);

  // Filter dữ liệu chi tiết
  const filteredDetailData = useMemo(() => {
    if (!Array.isArray(detailData) || detailData.length === 0) {
      return [];
    }
    
    return detailData.filter((item: LocationItem) => {
      const matchesSearch = item.tenhc?.toLowerCase().includes(modalSearchTerm.toLowerCase()) ||
                           item.ma?.includes(modalSearchTerm);
      const matchesType = selectedType === 'all' || item.loai === selectedType;
      return matchesSearch && matchesType;
    });
  }, [detailData, modalSearchTerm, selectedType]);

  // Get unique types
  const types = useMemo(() => {
    if (!Array.isArray(detailData) || detailData.length === 0) {
      return [];
    }
    
    const uniqueTypes = [...new Set(detailData.map((item: LocationItem) => item.loai).filter(Boolean))];
    return uniqueTypes.sort();
  }, [detailData]);

  const provinceTypes = useMemo(() => {
    if (!Array.isArray(provinces) || provinces.length === 0) {
      return [];
    }
    
    const types = [...new Set(provinces.map(p => p.place_type).filter(Boolean))];
    return types.sort();
  }, [provinces]);

  // Statistics
  const stats = useMemo(() => {
    if (!Array.isArray(provinces) || provinces.length === 0) {
      return { totalProvinces: 0, withMerger: 0, totalWards: 0, avgMergerRate: 0 };
    }
    
    // Chỉ tính merger rate cho những tỉnh có sáp nhập
    const provincesWithMerger = provinces.filter(p => p.merger_type === "Có sáp nhập");
    const totalMergerRate = provincesWithMerger.reduce((sum, p) => sum + (p.merger_rate || 0), 0);
    
    return {
      totalProvinces: provinces.length,
      withMerger: provincesWithMerger.length,
      totalWards: provinces.reduce((sum, p) => sum + (p.ward_count || 0), 0),
      avgMergerRate: provincesWithMerger.length > 0 ? totalMergerRate / provincesWithMerger.length : 0
    };
  }, [provinces]);

  const formatPopulation = (pop: string): string => {
    if (!pop || pop === "đang cập nhật") return "Đang cập nhật";
    const num = parseInt(pop);
    return isNaN(num) ? "Không xác định" : num.toLocaleString('vi-VN');
  };

  const formatArea = (area: number): string => {
    if (!area) return "0";
    return parseFloat(area.toString()).toFixed(2);
  };

  // Không render cho đến khi mounted
  if (!mounted) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-2xl shadow-xl border border-slate-200">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-slate-200 border-t-blue-600 mx-auto mb-6"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Map className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <p className="text-slate-700 font-medium text-lg mb-2">Đang tải dữ liệu</p>
          <p className="text-slate-500 text-sm">Vui lòng chờ trong giây lát...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header với gradient - compact */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 shadow-lg">
        <div className="max-w-[1400px] mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 backdrop-blur-sm p-2 rounded-xl">
                <Map className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">
                  Hệ thống tra cứu hành chính Việt Nam
                </h1>
                <p className="text-blue-100 text-sm">
                  {stats.totalProvinces} tỉnh thành phố • {stats.totalWards.toLocaleString()} đơn vị hành chính
                </p>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm px-3 py-1 rounded-lg border border-white/20">
              <span className="text-white/90 text-xs font-medium">Cập nhật: 2025</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 py-4">
        {/* Statistics Cards - compact */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          <div className="bg-white rounded-xl shadow-md border border-slate-200 p-3 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between mb-2">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Building className="h-4 w-4 text-blue-600" />
              </div>
              <span className="text-blue-600 text-xs font-semibold bg-blue-50 px-2 py-0.5 rounded-full">TỔNG</span>
            </div>
            <div className="text-xl font-bold text-slate-800">{stats.totalProvinces}</div>
            <div className="text-slate-600 text-xs font-medium">Tỉnh thành phố</div>
          </div>

          <div className="bg-white rounded-xl shadow-md border border-slate-200 p-3 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between mb-2">
              <div className="bg-green-100 p-2 rounded-lg">
                <TrendingUp className="h-4 w-4 text-green-600" />
              </div>
              <span className="text-green-600 text-xs font-semibold bg-green-50 px-2 py-0.5 rounded-full">SÁP NHẬP</span>
            </div>
            <div className="text-xl font-bold text-slate-800">{stats.withMerger}</div>
            <div className="text-slate-600 text-xs font-medium">Đã sáp nhập</div>
          </div>

          <div className="bg-white rounded-xl shadow-md border border-slate-200 p-3 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between mb-2">
              <div className="bg-purple-100 p-2 rounded-lg">
                <Database className="h-4 w-4 text-purple-600" />
              </div>
              <span className="text-purple-600 text-xs font-semibold bg-purple-50 px-2 py-0.5 rounded-full">ĐƠN VỊ</span>
            </div>
            <div className="text-xl font-bold text-slate-800">{stats.totalWards.toLocaleString()}</div>
            <div className="text-slate-600 text-xs font-medium">Đơn vị hành chính</div>
          </div>

          <div className="bg-white rounded-xl shadow-md border border-slate-200 p-3 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between mb-2">
              <div className="bg-orange-100 p-2 rounded-lg">
                <Target className="h-4 w-4 text-orange-600" />
              </div>
              <span className="text-orange-600 text-xs font-semibold bg-orange-50 px-2 py-0.5 rounded-full">TỶ LỆ</span>
            </div>
            <div className="text-xl font-bold text-slate-800">{Math.round(stats.avgMergerRate || 0)}%</div>
            <div className="text-slate-600 text-xs font-medium">TB sáp nhập</div>
          </div>
        </div>

        {/* Search and Filter Controls - compact */}
        <div className="bg-white rounded-xl shadow-md border border-slate-200 p-4 mb-4">
          <div className="flex flex-col lg:flex-row gap-3">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm tỉnh thành theo tên hoặc mã..."
                  className="w-full pl-10 pr-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  value={mainSearchTerm}
                  onChange={(e) => setMainSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Filters */}
            <div className="flex gap-2">
              <select
                className="px-3 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-700 text-sm font-medium min-w-[120px]"
                value={provinceFilter}
                onChange={(e) => setProvinceFilter(e.target.value)}
              >
                <option value="all">Tất cả loại</option>
                {provinceTypes.map(type => (
                  <option key={type} value={type}>
                    {type === "Thành phố Trung Ương" ? "TP Trung ương" : "Tỉnh"}
                  </option>
                ))}
              </select>

              <select
                className="px-3 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-700 text-sm font-medium min-w-[120px]"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'name' | 'wards' | 'merger_rate')}
              >
                <option value="name">Sắp xếp theo tên</option>
                <option value="wards">Số đơn vị</option>
                <option value="merger_rate">Tỷ lệ sáp nhập</option>
              </select>

              <div className="flex bg-slate-100 rounded-lg p-0.5">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-all text-xs ${viewMode === 'grid' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-600 hover:text-slate-800'}`}
                >
                  <Grid3X3 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-all text-xs ${viewMode === 'list' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-600 hover:text-slate-800'}`}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Province Display - clean modern cards */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
            {filteredProvinces.map((province) => (
              <div
                key={province.province_code}
                className={`group relative bg-white rounded-xl border border-slate-200 p-4 transition-all duration-300 ${
                  province.has_detail && province.merger_type === "Có sáp nhập"
                    ? 'cursor-pointer hover:shadow-lg hover:shadow-slate-200/50 hover:-translate-y-0.5 hover:border-blue-300' 
                    : 'cursor-default opacity-90'
                }`}
                onClick={() => handleProvinceClick(province)}
              >
                {/* Content */}
                <div className="space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1 pr-2">
                      <h3 className={`font-bold text-slate-800 text-sm leading-tight transition-colors duration-300 ${
                        province.has_detail && province.merger_type === "Có sáp nhập" ? 'group-hover:text-blue-600' : ''
                      }`}>
                        {province.name.replace("Thành phố ", "TP ").replace("Tỉnh ", "")}
                      </h3>
                      <p className="text-slate-500 text-xs mt-1">{province.administrative_center}</p>
                    </div>
                    <div className="flex-shrink-0">
                      <span className="inline-flex items-center justify-center px-2 py-1 bg-slate-800 text-white text-xs font-bold rounded-md shadow-sm">
                        {province.province_code}
                      </span>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-slate-50 rounded-lg p-2 border border-slate-100">
                      <div className="text-lg font-bold text-slate-800">{province.ward_count}</div>
                      <div className="text-xs text-slate-600">Đơn vị</div>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-2 border border-slate-100">
                      <div className={`text-lg font-bold ${
                        province.merger_type === "Có sáp nhập" 
                          ? province.merger_rate > 50 ? 'text-green-600' : 'text-orange-500'
                          : 'text-slate-500'
                      }`}>
                        {province.merger_type === "Có sáp nhập" ? `${province.merger_rate}%` : "0%"}
                      </div>
                      <div className="text-xs text-slate-600">
                        {province.merger_type === "Có sáp nhập" ? "Sáp nhập" : "Không sáp nhập"}
                      </div>
                    </div>
                  </div>

                  {/* Badges - simplified */}
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-1">
                      {province.place_type === "Thành phố Trung Ương" && (
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                          TP TW
                        </span>
                      )}
                      
                      {province.merger_type === "Có sáp nhập" && (
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                          Sáp nhập
                        </span>
                      )}

                      {province.merged_provinces && province.merged_provinces.length > 0 && (
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                          +{province.merged_provinces.length}
                        </span>
                      )}
                    </div>

                    {/* Merged Provinces - integrated nicely */}
                    {province.merged_provinces && province.merged_provinces.length > 0 && (
                      <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border-l-2 border-amber-300 pl-2 pr-1 py-1">
                        <div className="text-xs text-amber-700 font-medium mb-0.5">
                          Từ {province.merged_provinces.length} tỉnh:
                        </div>
                        <div className="text-xs text-amber-800 leading-relaxed">
                          {province.merged_provinces.join(" • ")}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Merged Provinces List */}
                  {/* Removed - now integrated above */}

                  {/* Action - only show if has detail AND has merger */}
                  {province.has_detail && province.merger_type === "Có sáp nhập" && (
                    <div className="flex items-center justify-between p-2 bg-blue-50 rounded-lg border border-blue-100 group-hover:bg-blue-100 transition-colors duration-300">
                      <span className="text-xs font-medium text-blue-600">Xem chi tiết</span>
                      <ChevronRight className="h-3 w-3 text-blue-500 group-hover:translate-x-0.5 transition-transform duration-300" />
                    </div>
                  )}

                  {/* No detail indicator */}
                  {!(province.has_detail && province.merger_type === "Có sáp nhập") && (
                    <div className="text-center py-2">
                      <span className="text-xs text-slate-400">
                        {!province.has_detail ? "Chưa có dữ liệu chi tiết" : "Không có dữ liệu sáp nhập"}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredProvinces.map((province) => (
              <div
                key={province.province_code}
                className={`group relative bg-white rounded-xl border border-slate-200 p-4 transition-all duration-300 ${
                  province.has_detail && province.merger_type === "Có sáp nhập"
                    ? 'cursor-pointer hover:shadow-lg hover:shadow-slate-200/50 hover:border-blue-300' 
                    : 'cursor-default opacity-90'
                }`}
                onClick={() => handleProvinceClick(province)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center border border-slate-200">
                        <Building className="h-5 w-5 text-slate-600" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className={`font-bold text-slate-800 text-base transition-colors ${
                          province.has_detail && province.merger_type === "Có sáp nhập" ? 'group-hover:text-blue-600' : ''
                        }`}>
                          {province.name}
                        </h3>
                       <span className="inline-flex items-center justify-center px-2 py-1 bg-slate-800 text-white text-xs font-bold rounded-md shadow-sm">
                        {province.province_code}
                      </span>
                      </div>
                      <p className="text-slate-600 text-sm mb-2">
                        {province.administrative_center}
                      </p>
                      <div className="flex items-center gap-3">
                        {province.place_type === "Thành phố Trung Ương" && (
                          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                            TP TW
                          </span>
                        )}
                        
                        {province.merger_type === "Có sáp nhập" && (
                          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                            Sáp nhập
                          </span>
                        )}

                        {province.merged_provinces && province.merged_provinces.length > 0 && (
                          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                            +{province.merged_provinces.length} tỉnh cũ
                          </span>
                        )}

                        {!province.has_detail && (
                          <span className="text-xs text-slate-400">Chưa có dữ liệu chi tiết</span>
                        )}

                        {province.has_detail && province.merger_type === "Không sáp nhập" && (
                          <span className="text-xs text-slate-400">Không có dữ liệu sáp nhập</span>
                        )}
                      </div>

                      {/* Merged Provinces for List View - better layout */}
                      {province.merged_provinces && province.merged_provinces.length > 0 && (
                        <div className="mt-2 bg-gradient-to-r from-amber-50 to-yellow-50 border-l-4 border-amber-300 pl-3 pr-2 py-2 rounded-r-lg">
                          <div className="flex items-center gap-2 mb-1">
                            <TrendingUp className="h-3 w-3 text-amber-600" />
                            <span className="text-xs text-amber-700 font-semibold">
                              Sáp nhập từ {province.merged_provinces.length} tỉnh:
                            </span>
                          </div>
                          <div className="text-sm text-amber-800 font-medium">
                            {province.merged_provinces.join(" • ")}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-center">
                      <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 min-w-[70px]">
                        <div className="text-xl font-bold text-slate-800">{province.ward_count}</div>
                        <div className="text-xs text-slate-600">Đơn vị</div>
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 min-w-[70px]">
                        <div className={`text-xl font-bold ${
                          province.merger_type === "Có sáp nhập" 
                            ? province.merger_rate > 50 ? 'text-green-600' : 'text-orange-500'
                            : 'text-slate-500'
                        }`}>
                          {province.merger_type === "Có sáp nhập" ? `${province.merger_rate}%` : "0%"}
                        </div>
                        <div className="text-xs text-slate-600">
                          {province.merger_type === "Có sáp nhập" ? "Sáp nhập" : "Không sáp nhập"}
                        </div>
                      </div>
                    </div>
                    {province.has_detail && province.merger_type === "Có sáp nhập" && (
                      <>
                        <div className="bg-blue-50 rounded-lg p-3 border border-blue-100 group-hover:bg-blue-100 transition-colors duration-300">
                          <div className="flex items-center text-blue-600">
                            <Eye className="h-4 w-4 mr-2" />
                            <span className="text-sm font-medium">Chi tiết</span>
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {filteredProvinces.length === 0 && (
          <div className="text-center py-8 bg-white rounded-xl shadow-md border border-slate-200">
            <div className="bg-slate-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
              <Search className="h-6 w-6 text-slate-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-1">Không tìm thấy kết quả</h3>
            <p className="text-slate-600 text-sm">Vui lòng thử lại với từ khóa khác</p>
          </div>
        )}
      </div>

      {/* Modal Popup - optimized for small screens */}
      {showModal && selectedProvince && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-1 sm:p-3 z-50" 
          onClick={closeModal}
          onWheel={(e) => e.stopPropagation()}
        >
          <div 
            className="bg-white rounded-lg sm:rounded-2xl shadow-2xl max-w-5xl w-full h-[98vh] sm:h-[90vh] flex flex-col overflow-hidden border border-slate-200"
            onClick={(e) => e.stopPropagation()}
            onWheel={(e) => e.stopPropagation()}
          >
            {/* Modal Header - compact */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-2 sm:p-3 flex justify-between items-center flex-shrink-0">
              <div className="flex items-center space-x-2">
                <div className="bg-white/20 backdrop-blur-sm p-1.5 rounded-lg">
                  <MapPin className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-lg font-bold truncate">{selectedProvince.name}</h2>
                  <p className="text-blue-100 text-xs hidden sm:block">
                    Mã: {selectedProvince.province_code} • {selectedProvince.administrative_center}
                  </p>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="p-1.5 hover:bg-white/20 rounded-lg transition-all duration-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Content - compact */}
            <div className="flex-1 p-2 sm:p-3 overflow-hidden flex flex-col">
              {/* Province Info Cards - responsive grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 sm:gap-2 mb-2 flex-shrink-0">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-1.5 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between mb-1">
                    <Building className="h-3 w-3 text-blue-600" />
                    <span className="text-xs font-semibold text-blue-700 bg-blue-200 px-1 py-0.5 rounded-full hidden sm:inline">TT</span>
                  </div>
                  <div className="font-bold text-xs text-blue-800 truncate">{selectedProvince.administrative_center}</div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 p-1.5 rounded-lg border border-green-200">
                  <div className="flex items-center justify-between mb-1">
                    <Database className="h-3 w-3 text-green-600" />
                    <span className="text-xs font-semibold text-green-700 bg-green-200 px-1 py-0.5 rounded-full hidden sm:inline">ĐV</span>
                  </div>
                  <div className="font-bold text-xs text-green-800">{selectedProvince.ward_count}</div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-1.5 rounded-lg border border-purple-200">
                  <div className="flex items-center justify-between mb-1">
                    <TrendingUp className="h-3 w-3 text-purple-600" />
                    <span className="text-xs font-semibold text-purple-700 bg-purple-200 px-1 py-0.5 rounded-full hidden sm:inline">SN</span>
                  </div>
                  <div className="font-bold text-xs text-purple-800">{selectedProvince.merger_rate}%</div>
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-1.5 rounded-lg border border-orange-200">
                  <div className="flex items-center justify-between mb-1">
                    <Target className="h-3 w-3 text-orange-600" />
                    <span className="text-xs font-semibold text-orange-700 bg-orange-200 px-1 py-0.5 rounded-full hidden sm:inline">LOẠI</span>
                  </div>
                  <div className="font-bold text-xs text-orange-800">
                    {selectedProvince.place_type === "Thành phố Trung Ương" ? "TP TW" : "Tỉnh"}
                  </div>
                </div>
              </div>

              {/* Merged Provinces - compact */}
              {selectedProvince.merged_provinces && selectedProvince.merged_provinces.length > 0 && (
                <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-lg p-2 mb-2 flex-shrink-0">
                  <div className="flex items-center mb-1">
                    <TrendingUp className="h-3 w-3 text-yellow-600 mr-1" />
                    <span className="font-bold text-yellow-800 text-xs">
                      Sáp nhập ({selectedProvince.merged_provinces.length})
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {selectedProvince.merged_provinces.map((province, index) => (
                      <span key={index} className="bg-yellow-200 text-yellow-800 px-1.5 py-0.5 rounded text-xs font-semibold">
                        {province}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Detail Data - mobile optimized */}
              {selectedProvince.has_detail ? (
                detailLoading ? (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center bg-white p-4 rounded-xl shadow-lg border border-slate-200">
                      <div className="relative mb-3">
                        <div className="animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-blue-600 mx-auto"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Database className="h-3 w-3 text-blue-600" />
                        </div>
                      </div>
                      <p className="text-slate-700 font-medium text-sm">Đang tải...</p>
                    </div>
                  </div>
                ) : detailData.length > 0 ? (
                  <div className="flex-1 flex flex-col min-h-0">
                    {/* Search controls - compact */}
                    <div className="flex items-center justify-between mb-2 flex-shrink-0">
                      <h3 className="text-sm font-bold text-slate-800 flex items-center">
                        <Database className="h-4 w-4 mr-1 text-blue-600" />
                        Chi tiết ({detailData.length})
                      </h3>
                    </div>
                    
                    <div className="mb-2 flex gap-2 flex-shrink-0">
                      <div className="flex-1 relative">
                        <Search className="absolute left-2 top-2 h-3 w-3 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Tìm kiếm..."
                          className="w-full pl-7 pr-2 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          value={modalSearchTerm}
                          onChange={(e) => setModalSearchTerm(e.target.value)}
                        />
                      </div>
                      <select
                        className="px-2 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white min-w-[80px]"
                        value={selectedType}
                        onChange={(e) => setSelectedType(e.target.value)}
                      >
                        <option value="all">Tất cả</option>
                        {types.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>

                    {/* Content - mobile friendly layout */}
                    <div className="flex-1 min-h-0 flex flex-col sm:grid sm:grid-cols-3 sm:gap-3">
                      {/* List - takes full width on mobile, 2 columns on desktop */}
                      <div className="col-span-2 border border-slate-200 rounded-lg flex flex-col min-h-0 bg-white">
                        <div className="bg-slate-50 p-2 border-b border-slate-200 font-bold text-slate-800 text-xs flex-shrink-0 rounded-t-lg">
                          <div className="flex items-center justify-between">
                            <span>Danh sách ({filteredDetailData.length})</span>
                            <span className="text-xs font-normal text-slate-600 bg-slate-200 px-1.5 py-0.5 rounded-full">
                              {filteredDetailData.length > 50 ? `50/${filteredDetailData.length}` : 'Tất cả'}
                            </span>
                          </div>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                          {filteredDetailData.slice(0, 50).map((item: LocationItem) => (
                            <div
                              key={item.id}
                              className={`p-2 border-b border-slate-50 cursor-pointer hover:bg-slate-50 transition-all duration-200 ${
                                selectedItem?.id === item.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                              }`}
                              onClick={() => setSelectedItem(item)}
                            >
                              <div className="flex justify-between items-start">
                                <div className="flex-1 min-w-0">
                                  <div className="font-bold text-slate-800 text-xs truncate mb-1">{item.tenhc}</div>
                                  <div className="flex items-center gap-1 mb-1">
                                    <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded text-xs font-semibold">
                                      {item.loai}
                                    </span>
                                    <span className="text-slate-500 text-xs font-mono">#{item.ma}</span>
                                  </div>
                                  <div className="text-xs text-slate-600 grid grid-cols-2 gap-1">
                                    <div className="flex items-center gap-1">
                                      <Users className="h-2.5 w-2.5" />
                                      <span className="truncate">{parseInt(item.dansonguoi) > 0 ? parseInt(item.dansonguoi).toLocaleString() : 'N/A'}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <BarChart3 className="h-2.5 w-2.5" />
                                      <span>{formatArea(item.dientichkm2)} km²</span>
                                    </div>
                                  </div>
                                </div>
                                <ChevronRight className={`h-3 w-3 transition-all flex-shrink-0 ml-1 ${selectedItem?.id === item.id ? 'text-blue-600 rotate-90' : 'text-slate-400'}`} />
                              </div>
                            </div>
                          ))}
                          {filteredDetailData.length === 0 && (
                            <div className="p-4 text-center text-slate-500">
                              <Search className="h-6 w-6 mx-auto mb-2 opacity-50" />
                              <p className="font-medium text-sm">Không tìm thấy</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Detail Panel - hidden on mobile, shown on desktop */}
                      <div className="hidden sm:flex col-span-1 border border-slate-200 rounded-lg flex-col min-h-0 bg-white">
                        <div className="bg-slate-50 p-2 border-b border-slate-200 font-bold text-slate-800 text-xs flex-shrink-0 rounded-t-lg">
                          <div className="flex items-center">
                            <Info className="h-3 w-3 mr-1 text-blue-600" />
                            Thông tin
                          </div>
                        </div>
                        <div className="flex-1 p-2">
                          {selectedItem ? (
                            <div className="h-full flex flex-col space-y-2">
                              {/* Header */}
                              <div className="text-center border-b border-slate-200 pb-2 mb-2">
                                <h4 className="font-bold text-xs text-slate-800 mb-1 line-clamp-2 leading-tight">{selectedItem.tenhc}</h4>
                                <div className="flex justify-center items-center gap-1">
                                  <span className="bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded text-xs font-bold">
                                    {selectedItem.loai}
                                  </span>
                                  <span className="text-slate-500 font-mono text-xs">
                                    #{selectedItem.ma}
                                  </span>
                                </div>
                              </div>

                              {/* Content */}
                              <div className="grid grid-cols-1 gap-2 flex-1">
                                {/* Dân số */}
                                <div className="bg-gradient-to-r from-green-50 to-green-100 p-2 rounded-lg border border-green-200">
                                  <div className="flex items-center text-xs mb-0.5">
                                    <Users className="h-2.5 w-2.5 text-green-600 mr-1" />
                                    <span className="text-green-800 font-semibold">Dân số</span>
                                  </div>
                                  <div className="font-bold text-xs text-green-800 truncate">
                                    {formatPopulation(selectedItem.dansonguoi)}
                                  </div>
                                </div>

                                {/* Diện tích */}
                                <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-2 rounded-lg border border-blue-200">
                                  <div className="flex items-center text-xs mb-0.5">
                                    <BarChart3 className="h-2.5 w-2.5 text-blue-600 mr-1" />
                                    <span className="text-blue-800 font-semibold">Diện tích</span>
                                  </div>
                                  <div className="font-bold text-xs text-blue-800">
                                    {formatArea(selectedItem.dientichkm2)} km²
                                  </div>
                                </div>

                                {/* Trung tâm */}
                                <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-2 rounded-lg border border-orange-200">
                                  <div className="flex items-center text-xs mb-0.5">
                                    <Building className="h-2.5 w-2.5 text-orange-600 mr-1" />
                                    <span className="text-orange-800 font-semibold">Trung tâm</span>
                                  </div>
                                  <div className="text-xs text-orange-800 font-medium leading-tight line-clamp-2">
                                    {selectedItem.trungtamhc}
                                  </div>
                                </div>

                                {/* Trước sáp nhập */}
                                {selectedItem.truocsapnhap && selectedItem.truocsapnhap !== "Không sáp nhập" && (
                                  <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 p-2 rounded-lg border border-yellow-200">
                                    <div className="text-xs font-semibold text-yellow-800 mb-0.5">Trước sáp nhập:</div>
                                    <div className="text-xs text-yellow-700 leading-tight line-clamp-3">
                                      {selectedItem.truocsapnhap}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="flex-1 flex items-center justify-center text-slate-500 h-full">
                              <div className="text-center">
                                <div className="bg-slate-100 w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-2">
                                  <MapPin className="h-4 w-4 opacity-50" />
                                </div>
                                <p className="text-xs font-bold text-slate-600 mb-1">Chưa chọn</p>
                                <p className="text-xs text-slate-500">Nhấp để xem</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Mobile Detail Panel - shown when item selected on mobile */}
                      {selectedItem && (
                        <div className="sm:hidden mt-2 bg-white border border-slate-200 rounded-lg p-2">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-bold text-sm text-slate-800">{selectedItem.tenhc}</h4>
                            <button 
                              onClick={() => setSelectedItem(null)}
                              className="text-slate-400 hover:text-slate-600"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <span className="text-slate-600">Dân số:</span>
                              <div className="font-semibold">{formatPopulation(selectedItem.dansonguoi)}</div>
                            </div>
                            <div>
                              <span className="text-slate-600">Diện tích:</span>
                              <div className="font-semibold">{formatArea(selectedItem.dientichkm2)} km²</div>
                            </div>
                            <div className="col-span-2">
                              <span className="text-slate-600">Trung tâm:</span>
                              <div className="font-semibold">{selectedItem.trungtamhc}</div>
                            </div>
                            {selectedItem.truocsapnhap && selectedItem.truocsapnhap !== "Không sáp nhập" && (
                              <div className="col-span-2">
                                <span className="text-slate-600">Trước sáp nhập:</span>
                                <div className="font-semibold text-xs">{selectedItem.truocsapnhap}</div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-slate-500">
                    <div className="text-center bg-white p-4 rounded-xl shadow-lg border border-slate-200">
                      <div className="bg-slate-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Building className="h-6 w-6 opacity-50" />
                      </div>
                      <p className="font-bold text-sm text-slate-700 mb-1">Chưa có dữ liệu</p>
                      <p className="text-slate-500 text-xs">Đang được cập nhật</p>
                    </div>
                  </div>
                )
              ) : (
                <div className="flex-1 flex items-center justify-center text-slate-500">
                  <div className="text-center bg-white p-4 rounded-xl shadow-lg border border-slate-200">
                    <div className="bg-slate-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Building className="h-6 w-6 opacity-50" />
                    </div>
                    <p className="font-bold text-sm text-slate-700 mb-1">Không có dữ liệu</p>
                    <p className="text-slate-500 text-xs">Chưa có dữ liệu chi tiết</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Footer - compact */}
      <footer className="bg-white border-t border-slate-200 mt-8">
        <div className="max-w-[1400px] mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-2 md:mb-0">
              <div className="bg-blue-100 p-1.5 rounded-lg">
                <Map className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="font-bold text-slate-800 text-sm">Hệ thống tra cứu hành chính Việt Nam</p>
                <p className="text-slate-600 text-xs">© 2025 - Tất cả quyền được bảo lưu</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-xs text-slate-600">
              <span className="bg-slate-100 px-2 py-1 rounded-lg font-medium">
                Cập nhật: 2025
              </span>
              <span className="bg-slate-100 px-2 py-1 rounded-lg font-medium">
                v2.0
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default VietnamProvincesLookup;