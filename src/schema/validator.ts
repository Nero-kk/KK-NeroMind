import { MindMapSchema, MindMapMetadata, CURRENT_SCHEMA_VERSION } from './types';

/**
 * Schema Validator
 * 
 * 근거: KK-NeroMind-Schema-v5.2.1.md Section 7
 * 
 * 원칙:
 * 1. Schema is Law - 정의되지 않은 것은 거부
 * 2. Fail Loudly - 실패 시 명확히 알림
 * 3. No Auto-Correction - 자동 수정 금지
 */
export class SchemaValidator {
  /**
   * 스키마 검증
   * 
   * @returns true if valid, false otherwise
   */
  validate(data: unknown): data is MindMapSchema {
    // 1. 타입 체크
    if (typeof data !== 'object' || data === null) {
      console.error('[SchemaValidator] Data is not an object');
      return false;
    }
    
    const schema = data as any;
    
    // 2. schemaVersion 검증
    if (!this.validateSchemaVersion(schema)) {
      return false;
    }
    
    // 3. 필수 필드 존재 검증
    if (!schema.metadata || !schema.nodes || !schema.edges || !schema.camera) {
      console.error('[SchemaValidator] Missing required top-level fields');
      return false;
    }
    
    // 4. metadata 검증
    if (!this.validateMetadata(schema.metadata)) {
      return false;
    }
    
    // 5. nodes 검증
    if (!this.validateNodes(schema.nodes)) {
      return false;
    }
    
    // 6. edges 검증
    if (!this.validateEdges(schema.edges, schema.nodes)) {
      return false;
    }
    
    // 7. camera 검증
    if (!this.validateCamera(schema.camera)) {
      return false;
    }
    
    return true;
  }
  
  /**
   * Sanitize (Phase 1에서는 검증만)
   * 
   * @returns data if valid, null otherwise
   */
  sanitize(data: unknown): MindMapSchema | null {
    return this.validate(data) ? (data as MindMapSchema) : null;
  }
  
  /**
   * schemaVersion 검증
   */
  private validateSchemaVersion(schema: any): boolean {
    if (typeof schema.schemaVersion !== 'number') {
      console.error('[SchemaValidator] schemaVersion is not a number');
      return false;
    }
    
    if (!Number.isInteger(schema.schemaVersion)) {
      console.error('[SchemaValidator] schemaVersion must be an integer');
      return false;
    }
    
    if (schema.schemaVersion <= 0) {
      console.error('[SchemaValidator] schemaVersion must be positive');
      return false;
    }
    
    if (schema.schemaVersion !== CURRENT_SCHEMA_VERSION) {
      console.error(`[SchemaValidator] Unsupported schema version: ${schema.schemaVersion}`);
      return false;
    }
    
    return true;
  }
  
  /**
   * metadata 검증
   * 
   * CRITICAL: 필드명 주의
   * - created (NOT createdAt)
   * - modified (NOT updatedAt)
   * - title (필수)
   */
  private validateMetadata(metadata: any): boolean {
    // 필수 필드 타입 검증
    if (typeof metadata.created !== 'number') {
      console.error('[SchemaValidator] metadata.created must be number');
      return false;
    }
    
    if (typeof metadata.modified !== 'number') {
      console.error('[SchemaValidator] metadata.modified must be number');
      return false;
    }
    
    if (typeof metadata.title !== 'string') {
      console.error('[SchemaValidator] metadata.title must be string');
      return false;
    }
    
    // 타임스탬프 범위 검증
    if (metadata.created < 0) {
      console.error('[SchemaValidator] metadata.created must be non-negative');
      return false;
    }
    
    if (metadata.modified < 0) {
      console.error('[SchemaValidator] metadata.modified must be non-negative');
      return false;
    }
    
    // 선택 필드 검증
    if (metadata.author !== undefined && typeof metadata.author !== 'string') {
      console.error('[SchemaValidator] metadata.author must be string');
      return false;
    }
    
    if (metadata.tags !== undefined) {
      if (!Array.isArray(metadata.tags)) {
        console.error('[SchemaValidator] metadata.tags must be array');
        return false;
      }
      
      for (const tag of metadata.tags) {
        if (typeof tag !== 'string') {
          console.error('[SchemaValidator] metadata.tags items must be strings');
          return false;
        }
      }
    }
    
    return true;
  }
  
  /**
   * nodes 검증
   */
  private validateNodes(nodes: any): boolean {
    if (typeof nodes !== 'object' || nodes === null) {
      console.error('[SchemaValidator] nodes must be an object');
      return false;
    }
    
    if (Array.isArray(nodes)) {
      console.error('[SchemaValidator] nodes must be Record, not Array');
      return false;
    }
    
    for (const [key, node] of Object.entries(nodes)) {
      if (!this.validateNode(key, node as any)) {
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * 개별 노드 검증
   */
  private validateNode(key: string, node: any): boolean {
    // ID 검증
    if (typeof node.id !== 'string') {
      console.error(`[SchemaValidator] Node ${key}: id must be string`);
      return false;
    }
    
    // Key와 ID 일치 검증
    if (node.id !== key) {
      console.error(`[SchemaValidator] Node ${key}: id mismatch`);
      return false;
    }
    
    // content 검증
    if (typeof node.content !== 'string') {
      console.error(`[SchemaValidator] Node ${key}: content must be string`);
      return false;
    }
    
    // position 검증
    if (!this.validatePosition(node.position)) {
      console.error(`[SchemaValidator] Node ${key}: invalid position`);
      return false;
    }
    
    // 선택 필드: size
    if (node.size !== undefined) {
      if (!this.validateSize(node.size)) {
        console.error(`[SchemaValidator] Node ${key}: invalid size`);
        return false;
      }
    }
    
    // 선택 필드: style (v1에서는 빈 객체만 허용)
    if (node.style !== undefined) {
      if (typeof node.style !== 'object' || node.style === null) {
        console.error(`[SchemaValidator] Node ${key}: style must be object`);
        return false;
      }
      
      if (Object.keys(node.style).length > 0) {
        console.error(`[SchemaValidator] Node ${key}: style must be empty in v1`);
        return false;
      }
    }
    
    // 선택 필드: linkedNote
    if (node.linkedNote !== undefined && typeof node.linkedNote !== 'string') {
      console.error(`[SchemaValidator] Node ${key}: linkedNote must be string`);
      return false;
    }
    
    return true;
  }
  
  /**
   * position 검증
   */
  private validatePosition(position: any): boolean {
    if (typeof position !== 'object' || position === null) {
      return false;
    }
    
    if (typeof position.x !== 'number' || typeof position.y !== 'number') {
      return false;
    }
    
    if (!Number.isFinite(position.x) || !Number.isFinite(position.y)) {
      return false;
    }
    
    return true;
  }
  
  /**
   * size 검증
   */
  private validateSize(size: any): boolean {
    if (typeof size !== 'object' || size === null) {
      return false;
    }
    
    if (typeof size.width !== 'number' || typeof size.height !== 'number') {
      return false;
    }
    
    if (size.width <= 0 || size.height <= 0) {
      return false;
    }
    
    return true;
  }
  
  /**
   * edges 검증
   */
  private validateEdges(edges: any, nodes: any): boolean {
    if (typeof edges !== 'object' || edges === null) {
      console.error('[SchemaValidator] edges must be an object');
      return false;
    }
    
    if (Array.isArray(edges)) {
      console.error('[SchemaValidator] edges must be Record, not Array');
      return false;
    }
    
    for (const [key, edge] of Object.entries(edges)) {
      if (!this.validateEdge(key, edge as any, nodes)) {
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * 개별 엣지 검증
   */
  private validateEdge(key: string, edge: any, nodes: any): boolean {
    // ID 검증
    if (typeof edge.id !== 'string') {
      console.error(`[SchemaValidator] Edge ${key}: id must be string`);
      return false;
    }
    
    // Key와 ID 일치
    if (edge.id !== key) {
      console.error(`[SchemaValidator] Edge ${key}: id mismatch`);
      return false;
    }
    
    // from, to 검증
    if (typeof edge.from !== 'string' || typeof edge.to !== 'string') {
      console.error(`[SchemaValidator] Edge ${key}: from/to must be strings`);
      return false;
    }
    
    // 참조 무결성 (Phase 1에서는 검증만, Sanitation은 Phase 2)
    if (!nodes[edge.from]) {
      console.warn(`[SchemaValidator] Edge ${key}: from node not found (will be sanitized in Phase 2)`);
    }
    
    if (!nodes[edge.to]) {
      console.warn(`[SchemaValidator] Edge ${key}: to node not found (will be sanitized in Phase 2)`);
    }
    
    // type 검증 (선택)
    if (edge.type !== undefined) {
      const validTypes = ['solid', 'dashed', 'dotted'];
      if (!validTypes.includes(edge.type)) {
        console.error(`[SchemaValidator] Edge ${key}: invalid type`);
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * camera 검증
   */
  private validateCamera(camera: any): boolean {
    if (typeof camera !== 'object' || camera === null) {
      console.error('[SchemaValidator] camera must be an object');
      return false;
    }
    
    if (typeof camera.x !== 'number' || 
        typeof camera.y !== 'number' || 
        typeof camera.zoom !== 'number') {
      console.error('[SchemaValidator] camera x/y/zoom must be numbers');
      return false;
    }
    
    if (!Number.isFinite(camera.x) || 
        !Number.isFinite(camera.y) || 
        !Number.isFinite(camera.zoom)) {
      console.error('[SchemaValidator] camera values must be finite');
      return false;
    }
    
    if (camera.zoom <= 0) {
      console.error('[SchemaValidator] camera.zoom must be positive');
      return false;
    }
    
    return true;
  }
}
