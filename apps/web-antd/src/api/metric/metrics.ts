import { requestClient } from '#/api/request';

/**
 * 指标值类型
 */
export type MetricValueType = 'NUMBER' | 'TEXT' | 'BOOLEAN' | 'ENUM';

/**
 * 指标图表类型
 */
export type MetricChartType = 'LINE' | 'BAR' | 'AREA' | 'SCATTER' | 'RADAR';

/**
 * 趋势方向
 */
export type MetricTrendDirection =
    | 'HIGHER_BETTER'
    | 'LOWER_BETTER'
    | 'RANGE_BETTER'
    | 'NEUTRAL';

/**
 * 雷达评分方式
 */
export type RadarScoreMethod =
    | 'HIGHER_BETTER'
    | 'LOWER_BETTER'
    | 'RANGE_BETTER';

/**
 * 雷达缺失值处理策略
 */
export type RadarMissingStrategy = 'IGNORE' | 'ZERO' | 'DEFAULT';

/**
 * 指标定义创建/更新请求
 */
export interface MetricDefinitionDTO {
    metricCode?: string;
    metricName?: string;
    category?: string;
    valueType?: MetricValueType | string;
    unit?: string;
    precisionDigits?: number;
    minValue?: number | string;
    maxValue?: number | string;
    normalMin?: number | string;
    normalMax?: number | string;
    chartType?: MetricChartType | string;
    trendDirection?: MetricTrendDirection | string;
    isDerived?: boolean;
    formulaCode?: string;
    enabled?: boolean;
    sortOrder?: number;
    extra?: string;
}

/**
 * 指标定义 VO
 */
export interface MetricDefinitionVO {
    id?: number;
    metricCode?: string;
    metricName?: string;
    category?: string;
    valueType?: MetricValueType | string;
    unit?: string;
    precisionDigits?: number;
    minValue?: number;
    maxValue?: number;
    normalMin?: number;
    normalMax?: number;
    chartType?: MetricChartType | string;
    trendDirection?: MetricTrendDirection | string;
    isDerived?: boolean;
    formulaCode?: string;
    enabled?: boolean;
    sortOrder?: number;
    extra?: string;
    createdAt?: string;
    updatedAt?: string;
}

/**
 * 用户指标单项录入
 */
export interface UserMetricItemDTO {
    metricCode?: string;
    value?: string;
    periodType?: string;
    periodStart?: string;
    periodEnd?: string;
    remark?: string;
    extra?: string;
}

/**
 * 批量录入用户指标请求
 */
export interface UserMetricBatchCreateDTO {
    userId?: number;
    recordTime?: string;
    scene?: string;
    source?: string;
    operatorId?: number;
    remark?: string;
    extra?: string;
    items: UserMetricItemDTO[];
}

/**
 * 用户指标记录 VO
 */
export interface UserMetricRecordVO {
    id?: number;
    userId?: number;
    metricId?: number;
    metricCode?: string;
    metricName?: string;
    unit?: string;
    valueType?: MetricValueType | string;

    recordTime?: string;
    recordDate?: string;

    periodType?: string;
    periodStart?: string;
    periodEnd?: string;

    numericValue?: number;
    textValue?: string;
    boolValue?: boolean;

    source?: string;
    batchId?: number;
    remark?: string;
    extra?: string;
}

/**
 * 趋势查询请求
 */
export interface UserMetricTrendQueryDTO {
    userId?: number;
    metricCodes: string[];
    startDate?: string;
    endDate?: string;
    periodType?: string;
}

/**
 * 趋势图单个点
 */
export interface UserMetricTrendPointVO {
    time?: string;
    value?: number;
    textValue?: string;
    boolValue?: boolean;
}

/**
 * 单个指标趋势
 */
export interface UserMetricTrendSeriesVO {
    metricCode?: string;
    metricName?: string;
    unit?: string;
    precisionDigits?: number;
    chartType?: MetricChartType | string;
    data: UserMetricTrendPointVO[];
}

/**
 * 趋势图响应
 */
export interface UserMetricTrendResponseVO {
    userId?: number;
    series: UserMetricTrendSeriesVO[];
}

/**
 * 雷达图模板创建/更新请求
 */
export interface RadarTemplateDTO {
    templateCode?: string;
    templateName?: string;
    category?: string;
    description?: string;
    scoreMin?: number | string;
    scoreMax?: number | string;
    enabled?: boolean;
    sortOrder?: number;
    extra?: string;
}

/**
 * 雷达图模板 VO
 */
export interface RadarTemplateVO {
    id?: number;
    templateCode?: string;
    templateName?: string;
    category?: string;
    description?: string;
    scoreMin?: number;
    scoreMax?: number;
    enabled?: boolean;
    sortOrder?: number;
    extra?: string;
    createdAt?: string;
    updatedAt?: string;
}

/**
 * 雷达图维度配置请求
 */
export interface RadarTemplateMetricDTO {
    templateId?: number;
    metricCode?: string;

    axisCode?: string;
    axisName?: string;

    scoreMethod?: RadarScoreMethod | string;
    scoreMinValue?: number | string;
    scoreMaxValue?: number | string;
    targetMinValue?: number | string;
    targetMaxValue?: number | string;

    weight?: number | string;
    required?: boolean;

    maxScore?: number | string;
    minScore?: number | string;

    missingStrategy?: RadarMissingStrategy | string;
    defaultScore?: number | string;

    sortOrder?: number;
    extra?: string;
}

/**
 * 雷达图维度配置 VO
 */
export interface RadarTemplateMetricVO {
    id?: number;
    templateId?: number;
    metricId?: number;
    metricCode?: string;
    metricName?: string;
    unit?: string;

    axisCode?: string;
    axisName?: string;

    scoreMethod?: RadarScoreMethod | string;
    scoreMinValue?: number;
    scoreMaxValue?: number;
    targetMinValue?: number;
    targetMaxValue?: number;

    weight?: number;
    required?: boolean;

    maxScore?: number;
    minScore?: number;

    missingStrategy?: RadarMissingStrategy | string;
    defaultScore?: number;

    sortOrder?: number;
    extra?: string;
}

/**
 * 用户雷达图查询请求
 */
export interface UserRadarQueryDTO {
    userId?: number;
    templateCode?: string;
    recordDate?: string;
}

/**
 * 雷达图指示器
 */
export interface UserRadarIndicatorVO {
    axisCode?: string;
    axisName?: string;
    max?: number;
}

/**
 * 雷达图数据系列
 */
export interface UserRadarSeriesVO {
    name?: string;
    values: Array<number | null>;
}

/**
 * 雷达图详情
 */
export interface UserRadarDetailVO {
    axisCode?: string;
    axisName?: string;

    metricCode?: string;
    metricName?: string;
    unit?: string;

    rawValue?: number;
    score?: number;

    scoreMethod?: RadarScoreMethod | string;
    missing: boolean;
    remark?: string;
}

/**
 * 用户雷达图响应
 */
export interface UserRadarResultVO {
    templateCode?: string;
    templateName?: string;

    scoreMin?: number;
    scoreMax?: number;

    recordDate?: string;
    totalScore?: number;

    indicators: UserRadarIndicatorVO[];
    series: UserRadarSeriesVO[];
    details: UserRadarDetailVO[];
}

/**
 * 通用 ID 类型
 */
export type ID = number | string;

/**
 * 指标定义 API
 */
export namespace MetricDefinitionApi {
    /**
     * 创建指标定义
     */
    export function create(data: MetricDefinitionDTO) {
        return requestClient.post<MetricDefinitionVO>(
            '/api/admin/metrics/definitions',
            data,
        );
    }

    /**
     * 查询指标定义列表
     */
    export function list(params?: { enabledOnly?: boolean }) {
        return requestClient.get<MetricDefinitionVO[]>(
            '/api/admin/metrics/definitions',
            { params },
        );
    }

    /**
     * 查询指标定义详情
     */
    export function detail(id: ID) {
        return requestClient.get<MetricDefinitionVO>(
            `/api/admin/metrics/definitions/${id}`,
        );
    }

    /**
     * 修改指标定义
     */
    export function update(id: ID, data: MetricDefinitionDTO) {
        return requestClient.put<MetricDefinitionVO>(
            `/api/admin/metrics/definitions/${id}`,
            data,
        );
    }

    /**
     * 禁用指标定义
     */
    export function disable(id: ID) {
        return requestClient.patch<MetricDefinitionVO>(
            `/api/admin/metrics/definitions/${id}/disable`,
        );
    }

    /**
     * 删除未使用的指标定义
     */
    export function remove(id: ID) {
        return requestClient.delete<string>(
            `/api/admin/metrics/definitions/${id}`,
        );
    }
}

/**
 * 用户指标记录 API
 */
export namespace UserMetricRecordApi {
    /**
     * 批量录入用户指标
     */
    export function createBatch(data: UserMetricBatchCreateDTO) {
        return requestClient.post<UserMetricRecordVO[]>(
            '/api/admin/metrics/records/batch',
            data,
        );
    }

    /**
     * 查询用户指标趋势
     */
    export function trend(data: UserMetricTrendQueryDTO) {
        return requestClient.post<UserMetricTrendResponseVO>(
            '/api/admin/metrics/records/trend',
            data,
        );
    }
}

/**
 * 雷达模板 API
 */
export namespace RadarTemplateApi {
    /**
     * 创建雷达图模板
     */
    export function create(data: RadarTemplateDTO) {
        return requestClient.post<RadarTemplateVO>(
            '/api/admin/metrics/radar/templates',
            data,
        );
    }

    /**
     * 查询雷达图模板列表
     */
    export function list(params?: { enabledOnly?: boolean }) {
        return requestClient.get<RadarTemplateVO[]>(
            '/api/admin/metrics/radar/templates',
            { params },
        );
    }

    /**
     * 查询雷达图模板详情
     */
    export function detail(id: ID) {
        return requestClient.get<RadarTemplateVO>(
            `/api/admin/metrics/radar/templates/${id}`,
        );
    }

    /**
     * 修改雷达图模板
     */
    export function update(id: ID, data: RadarTemplateDTO) {
        return requestClient.put<RadarTemplateVO>(
            `/api/admin/metrics/radar/templates/${id}`,
            data,
        );
    }

    /**
     * 查询模板下的雷达维度配置
     */
    export function metrics(templateId: ID) {
        return requestClient.get<RadarTemplateMetricVO[]>(
            `/api/admin/metrics/radar/templates/${templateId}/metrics`,
        );
    }
}

/**
 * 雷达维度 API
 */
export namespace RadarTemplateMetricApi {
    /**
     * 创建雷达图维度配置
     */
    export function create(data: RadarTemplateMetricDTO) {
        return requestClient.post<RadarTemplateMetricVO>(
            '/api/admin/metrics/radar/template-metrics',
            data,
        );
    }

    /**
     * 修改雷达图维度配置
     */
    export function update(id: ID, data: RadarTemplateMetricDTO) {
        return requestClient.put<RadarTemplateMetricVO>(
            `/api/admin/metrics/radar/template-metrics/${id}`,
            data,
        );
    }

    /**
     * 删除雷达图维度配置
     */
    export function remove(id: ID) {
        return requestClient.delete<string>(
            `/api/admin/metrics/radar/template-metrics/${id}`,
        );
    }
}

/**
 * 用户雷达图 API
 */
export namespace UserRadarApi {
    /**
     * 实时计算用户雷达图
     */
    export function getUserRadar(data: UserRadarQueryDTO) {
        return requestClient.post<UserRadarResultVO>(
            '/api/admin/metrics/radar/user',
            data,
        );
    }
}
