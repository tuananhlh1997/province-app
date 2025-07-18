'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Search, MapPin, Building, X, ChevronRight, TrendingUp, Database, Grid3X3, List, Target, Globe } from 'lucide-react';

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

  useEffect(() => {
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

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

  // Simple Base64 decode function
  function simpleBase64Decode(encodedData: string): LocationItem[] | null {
    try {
      console.log('🔍 Bước 1 - Payload đầu vào:', encodedData?.substring(0, 100) + '...');

      if (!encodedData || typeof encodedData !== 'string') {
        console.error('❌ Invalid payload: không phải string hoặc null');
        return null;
      }

      console.log('🔓 Bước 2 - Giải mã Base64...');
      let jsonString: string;
      try {
        // Decode Base64 với proper UTF-8 handling
        jsonString = decodeURIComponent(escape(atob(encodedData)));
      } catch (error) {
        console.error('❌ Base64 decode failed:', error);
        return null;
      }
      
      console.log('✅ Sau khi giải mã Base64:', jsonString.substring(0, 100) + '...');

      console.log('📋 Bước 3 - Parse JSON...');
      let parsedData: unknown;
      try {
        parsedData = JSON.parse(jsonString);
      } catch (error) {
        console.error('❌ JSON parse failed:', error);
        console.error('📄 Raw JSON string (first 200 chars):', jsonString.substring(0, 200));
        return null;
      }

      console.log('✅ JSON đã phân tích:', Array.isArray(parsedData) ? `Array với ${parsedData.length} items` : typeof parsedData);

      if (!isLocationItemArray(parsedData)) {
        console.error('❌ Parsed data does not match LocationItem interface');
        console.error('📋 Sample data structure:', Array.isArray(parsedData) ? parsedData[0] : parsedData);
        return null;
      }

      console.log('🎉 Decode thành công!');
      return parsedData;
    } catch (error) {
      console.error('💥 Giải mã thất bại:', error);
      if (error instanceof Error) {
        console.error('🏷️ Error name:', error.name);
        console.error('💬 Error message:', error.message);
      }
      return null;
    }
  }

  function isLocationItemArray(data: unknown): data is LocationItem[] {
    if (!Array.isArray(data)) {
      console.error('❌ Data is not an array');
      return false;
    }
    
    if (data.length === 0) {
      console.warn('⚠️ Data array is empty');
      return true;
    }

    // Check first few items
    const sampleSize = Math.min(3, data.length);
    for (let i = 0; i < sampleSize; i++) {
      const item = data[i];
      if (
        !item ||
        typeof item !== 'object' ||
        typeof (item as LocationItem).id !== 'number' ||
        typeof (item as LocationItem).matinh !== 'number' ||
        typeof (item as LocationItem).ma !== 'string' ||
        typeof (item as LocationItem).tentinh !== 'string' ||
        typeof (item as LocationItem).loai !== 'string' ||
        typeof (item as LocationItem).tenhc !== 'string' ||
        typeof (item as LocationItem).dientichkm2 !== 'number' ||
        typeof (item as LocationItem).dansonguoi !== 'string' ||
        typeof (item as LocationItem).trungtamhc !== 'string' ||
        typeof (item as LocationItem).kinhdo !== 'number' ||
        typeof (item as LocationItem).vido !== 'number' ||
        typeof (item as LocationItem).truocsapnhap !== 'string'
      ) {
        console.error(`❌ Item ${i} does not match LocationItem interface:`, item);
        return false;
      }
    }
    
    console.log('✅ Data validation passed');
    return true;
  }

  async function generateSimpleToken(timestamp: number): Promise<string> {
    const secret = 'secretkey123';
    const message = timestamp + secret;
    
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(message);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      
      return hashHex;
    } catch (error) {
      console.error('❌ Token generation failed:', error);
      return '';
    }
  }

  const loadProvinceDetail = async (province: ProvinceData) => {
    setDetailLoading(true);
    setDetailData([]);
    setSelectedItem(null);

    try {
      if (province.has_detail) {
        const fileName = province.short_code.toLowerCase();
        const timestamp = Date.now();
        
        console.log('🚀 Generating token...');
        const token = await generateSimpleToken(timestamp);

        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'Referer': 'https://tra-cuu-tinh-thanh.vercel.app/',
          'Origin': 'https://tra-cuu-tinh-thanh.vercel.app'
        };

        if (token) {
          headers['X-Token'] = token;
          headers['X-Time'] = timestamp.toString();
          console.log('🔑 Token generated successfully');
        } else {
          console.warn('⚠️ Token generation failed, proceeding without token');
        }

        console.log(`📡 Đang gọi API: /api/provinces/${fileName}`);
        const response = await fetch(`https://json-province.vercel.app/api/provinces/${fileName}`, {
          method: 'GET',
          headers: headers,
          credentials: 'omit'
        });

        console.log('📊 Response status:', response.status);

        if (!response.ok) {
          console.error(`❌ API error: ${response.status} - ${response.statusText}`);
          const errorText = await response.text();
          console.error('📄 Error response:', errorText);
          setDetailData([]);
          alert(`Lỗi khi tải dữ liệu từ API: ${response.status}. Vui lòng thử lại sau.`);
          return;
        }

        const result = await response.json();
        console.log('📦 API response structure:', {
          hasStatus: !!result.status,
          status: result.status,
          hasPayload: !!result.payload,
          payloadType: typeof result.payload,
          payloadLength: result.payload?.length
        });

        if (result.status === 'ok' && result.payload) {
          console.log('🔓 Đang giải mã dữ liệu...');
          const decodedData = simpleBase64Decode(result.payload);
          if (decodedData && Array.isArray(decodedData)) {
            console.log(`🎉 Đã tải thành công ${decodedData.length} records`);
            setDetailData(decodedData);
          } else {
            console.error('❌ Failed to decode data');
            setDetailData([]);
            alert('Không thể giải mã dữ liệu chi tiết. Dữ liệu có thể bị lỗi.');
          }
        } else if (Array.isArray(result)) {
          console.log('📋 Sử dụng dữ liệu từ API cũ (không mã hóa)');
          setDetailData(result);
        } else {
          console.error('❌ Unexpected response format:', result);
          setDetailData([]);
          alert('Định dạng dữ liệu từ API không hợp lệ.');
        }
      } else {
        console.log('ℹ️ Province không có dữ liệu chi tiết');
        setDetailData([]);
      }
    } catch (error) {
      console.error('💥 Error loading province detail:', error);
      setDetailData([]);
      alert('Lỗi khi tải dữ liệu chi tiết. Vui lòng kiểm tra kết nối mạng.');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleProvinceClick = (province: ProvinceData) => {
    if (province.has_detail && province.merger_type === "Có sáp nhập") {
      setSelectedProvince(province);
      setShowModal(true);
      loadProvinceDetail(province);
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

  if (!mounted) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center shadow-lg">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600 mx-auto mb-4"></div>
          <h3 className="text-gray-800 font-bold text-lg mb-2">Đang tải dữ liệu</h3>
          <p className="text-gray-600 text-sm">Vui lòng chờ trong giây lát...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Globe className="h-6 w-6 text-white" />
              <div>
                <h1 className="text-lg lg:text-xl font-bold text-white">
                  Tra cứu hành chính Việt Nam
                </h1>
                <p className="text-gray-300 text-xs lg:text-sm">
                  {stats.totalProvinces} tỉnh thành • {stats.totalWards.toLocaleString()} đơn vị
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-gray-300 text-xs bg-gray-800 px-2 py-1 rounded">2025</span>
              <span className="text-green-300 text-xs bg-green-900/30 px-2 py-1 rounded">v3.0</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Statistics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-3 mb-4">
          {[
            { icon: Building, label: 'Tỉnh thành', value: stats.totalProvinces, color: 'blue' },
            { icon: TrendingUp, label: 'Đã sáp nhập', value: stats.withMerger, color: 'emerald' },
            { icon: Database, label: 'Đơn vị', value: stats.totalWards, color: 'purple' },
            { icon: Target, label: 'Tỷ lệ sáp nhập', value: `${Math.round(stats.avgMergerRate || 0)}%`, color: 'orange' }
          ].map((stat, index) => (
            <div key={index} className="bg-white rounded-xl p-3 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <stat.icon className={`h-4 w-4 text-${stat.color}-600`} />
                <span className="text-xs text-gray-500 font-medium">{stat.label}</span>
              </div>
              <div className="text-lg font-bold text-gray-900">
                {typeof stat.value === 'string' ? stat.value : stat.value.toLocaleString()}
              </div>
            </div>
          ))}
        </div>

        {/* Search and Filter Controls */}
        <div className="bg-white rounded-xl p-3 mb-4 shadow-sm border border-gray-200">
          <div className="flex flex-col space-y-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm tỉnh thành..."
                className="w-full pl-10 pr-4 py-2.5 text-gray-700 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={mainSearchTerm}
                onChange={(e) => setMainSearchTerm(e.target.value)}
              />
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 justify-between">
              <div className="flex gap-2">
                <select
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-700 text-sm"
                  value={provinceFilter}
                  onChange={(e) => setProvinceFilter(e.target.value)}
                >
                  <option value="all">Tất cả loại</option>
                  {provinceTypes.map(type => (
                    <option key={type} value={type}>
                      {type === "Thành phố Trung Ương" ? "TP TW" : "Tỉnh"}
                    </option>
                  ))}
                </select>

                <select
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-700 text-sm"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'name' | 'wards' | 'merger_rate')}
                >
                  <option value="name">Tên A-Z</option>
                  <option value="wards">Số đơn vị</option>
                  <option value="merger_rate">Tỷ lệ sáp nhập</option>
                </select>
              </div>

              <div className="flex bg-gray-100 rounded-lg p-1">
                {[
                  { mode: 'grid', icon: Grid3X3 },
                  { mode: 'list', icon: List }
                ].map(({ mode, icon: Icon }) => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode as 'grid' | 'list')}
                    className={`flex items-center justify-center p-2 rounded-md transition-all ${
                      viewMode === mode 
                        ? 'bg-white shadow-sm text-blue-600' 
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Province Cards */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
            {filteredProvinces.map((province) => (
              <div
                key={province.province_code}
                className={`bg-white rounded-lg p-3 border border-gray-200 transition-all ${
                  province.has_detail && province.merger_type === "Có sáp nhập"
                    ? 'cursor-pointer hover:shadow-md hover:border-blue-300' 
                    : 'opacity-75'
                }`}
                onClick={() => handleProvinceClick(province)}
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-900 text-sm leading-tight flex-1 mr-2">
                    {province.name.replace("Thành phố ", "TP ").replace("Tỉnh ", "")}
                  </h3>
                  <span className="bg-gray-800 text-white text-xs px-2 py-1 rounded font-medium">
                    {province.province_code}
                  </span>
                </div>

                <p className="text-xs text-gray-500 mb-3 flex items-center">
                  <MapPin className="h-3 w-3 mr-1" />
                  {province.administrative_center}
                </p>

                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="text-center py-1">
                    <div className="text-sm font-bold text-gray-900">{province.ward_count}</div>
                    <div className="text-xs text-gray-500">Đơn vị</div>
                  </div>
                  <div className="text-center py-1">
                    <div className={`text-sm font-bold ${
                      province.merger_type === "Có sáp nhập" 
                        ? province.merger_rate > 50 ? 'text-green-600' : 'text-orange-600'
                        : 'text-gray-500'
                    }`}>
                      {province.merger_type === "Có sáp nhập" ? `${province.merger_rate}%` : "0%"}
                    </div>
                    <div className="text-xs text-gray-500">Sáp nhập</div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1 mb-2">
                  {province.place_type === "Thành phố Trung Ương" && (
                    <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded font-medium">
                      TP TW
                    </span>
                  )}
                  
                  {province.merger_type === "Có sáp nhập" && (
                    <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded font-medium">
                      Sáp nhập
                    </span>
                  )}

                  {province.merged_provinces && province.merged_provinces.length > 0 && (
                    <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded font-medium">
                      +{province.merged_provinces.length}
                    </span>
                  )}
                </div>

                {province.has_detail && province.merger_type === "Có sáp nhập" ? (
                  <div className="flex items-center justify-between text-blue-600 text-xs font-medium pt-1 border-t border-gray-100">
                    <span>Xem chi tiết</span>
                    <ChevronRight className="h-3 w-3" />
                  </div>
                ) : (
                  <div className="text-center pt-1 border-t border-gray-100">
                    <span className="text-xs text-gray-400">
                      {!province.has_detail ? "Chưa có dữ liệu" : "Không sáp nhập"}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredProvinces.map((province) => (
              <div
                key={province.province_code}
                className={`bg-white rounded-lg p-4 border border-gray-200 transition-all ${
                  province.has_detail && province.merger_type === "Có sáp nhập"
                    ? 'cursor-pointer hover:shadow-md hover:border-blue-300' 
                    : 'opacity-75'
                }`}
                onClick={() => handleProvinceClick(province)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <Building className="h-5 w-5 text-gray-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-semibold text-gray-900">{province.name}</h3>
                        <span className="bg-gray-800 text-white text-xs px-2 py-1 rounded font-medium">
                          {province.province_code}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 flex items-center">
                        <MapPin className="h-3 w-3 mr-1" />
                        {province.administrative_center}
                      </p>
                      
                      <div className="flex items-center gap-2 mt-2">
                        {province.place_type === "Thành phố Trung Ương" && (
                          <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded font-medium">TP TW</span>
                        )}
                        {province.merger_type === "Có sáp nhập" && (
                          <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded font-medium">Sáp nhập</span>
                        )}
                        {province.merged_provinces && province.merged_provinces.length > 0 && (
                          <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded font-medium">
                            +{province.merged_provinces.length} tỉnh cũ
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className="text-center">
                      <div className="text-lg font-bold text-gray-900">{province.ward_count}</div>
                      <div className="text-xs text-gray-500">Đơn vị</div>
                    </div>
                    <div className="text-center">
                      <div className={`text-lg font-bold ${
                        province.merger_type === "Có sáp nhập" 
                          ? province.merger_rate > 50 ? 'text-green-600' : 'text-orange-600'
                          : 'text-gray-500'
                      }`}>
                        {province.merger_type === "Có sáp nhập" ? `${province.merger_rate}%` : "0%"}
                      </div>
                      <div className="text-xs text-gray-500">Sáp nhập</div>
                    </div>
                    {province.has_detail && province.merger_type === "Có sáp nhập" && (
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* No Results */}
        {filteredProvinces.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Không tìm thấy kết quả</h3>
            <p className="text-gray-500">Vui lòng thử lại với từ khóa khác</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && selectedProvince && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-3 z-50" 
          onClick={closeModal}
        >
          <div 
            className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-gray-900 text-white p-3 flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <Globe className="h-5 w-5 text-white" />
                <div>
                  <h2 className="text-lg font-bold">{selectedProvince.name}</h2>
                  <p className="text-gray-300 text-xs">
                    {selectedProvince.province_code} • {selectedProvince.administrative_center}
                  </p>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="p-1 hover:bg-white/20 rounded transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 p-3 overflow-hidden flex flex-col bg-gray-50">
              {/* Province Info */}
              <div className="grid grid-cols-4 gap-2 mb-3">
                {[
                  { icon: Building, label: 'Trung tâm', value: selectedProvince.administrative_center },
                  { icon: Database, label: 'Đơn vị', value: selectedProvince.ward_count.toString() },
                  { icon: TrendingUp, label: 'Sáp nhập', value: `${selectedProvince.merger_rate}%` },
                  { icon: Target, label: 'Loại', value: selectedProvince.place_type === "Thành phố Trung Ương" ? "TP TW" : "Tỉnh" }
                ].map((info, index) => (
                  <div key={index} className="bg-white rounded p-2 border border-gray-200 text-center">
                    <info.icon className="h-4 w-4 text-gray-600 mx-auto mb-1" />
                    <div className="text-xs text-gray-600 mb-1">{info.label}</div>
                    <div className="font-semibold text-xs text-gray-900 truncate">{info.value}</div>
                  </div>
                ))}
              </div>

              {/* Merged Provinces */}
              {selectedProvince.merged_provinces && selectedProvince.merged_provinces.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded p-2 mb-3">
                  <div className="text-xs text-yellow-800 font-semibold mb-1">
                    Sáp nhập từ {selectedProvince.merged_provinces.length} tỉnh:
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {selectedProvince.merged_provinces.map((province, index) => (
                      <span key={index} className="bg-yellow-200 text-yellow-800 px-1 py-0.5 rounded text-xs">
                        {province}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Detail Data */}
              {selectedProvince.has_detail ? (
                detailLoading ? (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center bg-white p-4 rounded border border-gray-200">
                      <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-200 border-t-blue-600 mx-auto mb-2"></div>
                      <p className="text-gray-700 text-sm">Đang tải...</p>
                    </div>
                  </div>
                ) : detailData.length > 0 ? (
                  <div className="flex-1 flex flex-col min-h-0">
                    {/* Search */}
                    <div className="flex gap-2 mb-2">
                      <div className="flex-1 relative">
                        <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Tìm kiếm..."
                          className="w-full pl-7 pr-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          value={modalSearchTerm}
                          onChange={(e) => setModalSearchTerm(e.target.value)}
                        />
                      </div>
                      <select
                        className="px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
                        value={selectedType}
                        onChange={(e) => setSelectedType(e.target.value)}
                      >
                        <option value="all">Tất cả</option>
                        {types.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-3 gap-2">
                      {/* List */}
                      <div className="lg:col-span-2 bg-white border border-gray-200 rounded flex flex-col min-h-0">
                        <div className="bg-gray-50 p-2 border-b border-gray-200 text-xs font-semibold text-gray-800">
                          Danh sách ({filteredDetailData.length})
                        </div>
                        <div className="flex-1 overflow-y-auto">
                          {filteredDetailData.slice(0, 30).map((item: LocationItem) => (
                            <div
                              key={item.id}
                              className={`p-2 border-b border-gray-100 cursor-pointer hover:bg-gray-50 text-xs ${
                                selectedItem?.id === item.id ? 'bg-blue-50 border-l-2 border-l-blue-500' : ''
                              }`}
                              onClick={() => setSelectedItem(item)}
                            >
                              <div className="font-semibold text-gray-900 mb-1">{item.tenhc}</div>
                              <div className="flex items-center gap-2 text-gray-600">
                                <span className="bg-blue-100 text-blue-700 px-1 py-0.5 rounded text-xs">{item.loai}</span>
                                <span>👥 {parseInt(item.dansonguoi) > 0 ? parseInt(item.dansonguoi).toLocaleString() : 'N/A'}</span>
                                <span>📏 {formatArea(item.dientichkm2)}km²</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Detail Panel */}
                      <div className="bg-white border border-gray-200 rounded p-2">
                        <div className="text-xs font-semibold text-gray-800 mb-2">Chi tiết</div>
                        {selectedItem ? (
                          <div className="space-y-2">
                            <div className="text-center border-b border-gray-200 pb-2">
                              <div className="font-semibold text-sm text-gray-900">{selectedItem.tenhc}</div>
                              <div className="text-xs text-gray-600">{selectedItem.loai} • #{selectedItem.ma}</div>
                            </div>
                            <div className="space-y-1 text-xs">
                              <div className="bg-gray-50 rounded p-1">
                                <span className="text-gray-600">👥 Dân số: </span>
                                <span className="font-semibold">{formatPopulation(selectedItem.dansonguoi)}</span>
                              </div>
                              <div className="bg-gray-50 rounded p-1">
                                <span className="text-gray-600">📏 Diện tích: </span>
                                <span className="font-semibold">{formatArea(selectedItem.dientichkm2)} km²</span>
                              </div>
                              <div className="bg-gray-50 rounded p-1">
                                <span className="text-gray-600">🏛️ Trung tâm: </span>
                                <span className="font-semibold">{selectedItem.trungtamhc}</span>
                              </div>
                              {selectedItem.truocsapnhap && selectedItem.truocsapnhap !== "Không sáp nhập" && (
                                <div className="bg-yellow-50 border border-yellow-200 rounded p-1">
                                  <span className="text-yellow-700">📈 Trước sáp nhập: </span>
                                  <span className="font-semibold text-yellow-800">{selectedItem.truocsapnhap}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="text-center text-gray-500 py-4">
                            <MapPin className="h-6 w-6 mx-auto mb-1 opacity-50" />
                            <p className="text-xs">Chọn để xem chi tiết</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center bg-white p-4 rounded border border-gray-200">
                      <Building className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm text-gray-600">Chưa có dữ liệu</p>
                    </div>
                  </div>
                )
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center bg-white p-4 rounded border border-gray-200">
                    <Building className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-600">Không có dữ liệu</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-gray-900 mt-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Globe className="h-4 w-4 text-white" />
              <span className="text-white text-sm">Tra cứu hành chính VN © 2025</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-gray-300 text-xs bg-gray-800 px-2 py-1 rounded">2025</span>
              <span className="text-green-300 text-xs bg-green-900/30 px-2 py-1 rounded">v3.0</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default VietnamProvincesLookup;