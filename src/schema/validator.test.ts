import { SchemaValidator } from './validator';
import { CURRENT_SCHEMA_VERSION } from './types';

describe('SchemaValidator', () => {
  let validator: SchemaValidator;
  
  beforeEach(() => {
    validator = new SchemaValidator();
  });
  
  // 기본 스키마 템플릿
  const validSchema = {
    schemaVersion: 1,
    metadata: {
      created: 1705555200000,
      modified: 1705555200000,
      title: 'Test Map'
    },
    nodes: {},
    edges: {},
    camera: { x: 0, y: 0, zoom: 1 }
  };
  
  describe('유효한 스키마', () => {
    test('빈 Mind Map 검증 성공', () => {
      expect(validator.validate(validSchema)).toBe(true);
    });
    
    test('노드 있는 Mind Map 검증 성공', () => {
      const schema = {
        ...validSchema,
        nodes: {
          'node-1': {
            id: 'node-1',
            content: 'Test',
            position: { x: 0, y: 0 }
          }
        }
      };
      expect(validator.validate(schema)).toBe(true);
    });
    
    test('선택 필드 포함 검증 성공', () => {
      const schema = {
        ...validSchema,
        metadata: {
          ...validSchema.metadata,
          author: 'Test Author',
          tags: ['test', 'mindmap']
        }
      };
      expect(validator.validate(schema)).toBe(true);
    });
  });
  
  describe('schemaVersion 검증', () => {
    test('schemaVersion 없으면 실패', () => {
      const invalid = { ...validSchema };
      delete (invalid as any).schemaVersion;
      expect(validator.validate(invalid)).toBe(false);
    });
    
    test('문자열이면 실패', () => {
      const invalid = { ...validSchema, schemaVersion: '1' };
      expect(validator.validate(invalid)).toBe(false);
    });
    
    test('소수면 실패', () => {
      const invalid = { ...validSchema, schemaVersion: 1.5 };
      expect(validator.validate(invalid)).toBe(false);
    });
    
    test('0 이하면 실패', () => {
      const invalid = { ...validSchema, schemaVersion: 0 };
      expect(validator.validate(invalid)).toBe(false);
    });
    
    test('지원하지 않는 버전이면 실패', () => {
      const invalid = { ...validSchema, schemaVersion: 99 };
      expect(validator.validate(invalid)).toBe(false);
    });
  });
  
  describe('metadata 검증', () => {
    test('created 누락 시 실패', () => {
      const invalid = {
        ...validSchema,
        metadata: {
          modified: 1705555200000,
          title: 'Test'
        }
      };
      expect(validator.validate(invalid)).toBe(false);
    });
    
    test('modified 누락 시 실패', () => {
      const invalid = {
        ...validSchema,
        metadata: {
          created: 1705555200000,
          title: 'Test'
        }
      };
      expect(validator.validate(invalid)).toBe(false);
    });
    
    test('title 누락 시 실패', () => {
      const invalid = {
        ...validSchema,
        metadata: {
          created: 1705555200000,
          modified: 1705555200000
        }
      };
      expect(validator.validate(invalid)).toBe(false);
    });
    
    test('created 음수면 실패', () => {
      const invalid = {
        ...validSchema,
        metadata: {
          created: -1,
          modified: 1705555200000,
          title: 'Test'
        }
      };
      expect(validator.validate(invalid)).toBe(false);
    });
    
    test('modified 음수면 실패', () => {
      const invalid = {
        ...validSchema,
        metadata: {
          created: 1705555200000,
          modified: -1,
          title: 'Test'
        }
      };
      expect(validator.validate(invalid)).toBe(false);
    });
    
    test('created 타입이 number가 아니면 실패', () => {
      const invalid = {
        ...validSchema,
        metadata: {
          created: '1705555200000',
          modified: 1705555200000,
          title: 'Test'
        }
      };
      expect(validator.validate(invalid)).toBe(false);
    });
    
    test('modified 타입이 number가 아니면 실패', () => {
      const invalid = {
        ...validSchema,
        metadata: {
          created: 1705555200000,
          modified: '1705555200000',
          title: 'Test'
        }
      };
      expect(validator.validate(invalid)).toBe(false);
    });
    
    test('title 타입이 string이 아니면 실패', () => {
      const invalid = {
        ...validSchema,
        metadata: {
          created: 1705555200000,
          modified: 1705555200000,
          title: 123
        }
      };
      expect(validator.validate(invalid)).toBe(false);
    });
    
    test('author 타입이 string이 아니면 실패', () => {
      const invalid = {
        ...validSchema,
        metadata: {
          ...validSchema.metadata,
          author: 123
        }
      };
      expect(validator.validate(invalid)).toBe(false);
    });
    
    test('tags가 배열이 아니면 실패', () => {
      const invalid = {
        ...validSchema,
        metadata: {
          ...validSchema.metadata,
          tags: 'not-an-array'
        }
      };
      expect(validator.validate(invalid)).toBe(false);
    });
    
    test('tags 항목이 string이 아니면 실패', () => {
      const invalid = {
        ...validSchema,
        metadata: {
          ...validSchema.metadata,
          tags: ['valid', 123, 'strings']
        }
      };
      expect(validator.validate(invalid)).toBe(false);
    });
  });
  
  describe('nodes 검증', () => {
    test('Array면 실패', () => {
      const invalid = { ...validSchema, nodes: [] };
      expect(validator.validate(invalid)).toBe(false);
    });
    
    test('노드 ID 불일치 시 실패', () => {
      const invalid = {
        ...validSchema,
        nodes: {
          'node-1': {
            id: 'node-2',  // 불일치!
            content: 'Test',
            position: { x: 0, y: 0 }
          }
        }
      };
      expect(validator.validate(invalid)).toBe(false);
    });
    
    test('position NaN이면 실패', () => {
      const invalid = {
        ...validSchema,
        nodes: {
          'node-1': {
            id: 'node-1',
            content: 'Test',
            position: { x: NaN, y: 0 }
          }
        }
      };
      expect(validator.validate(invalid)).toBe(false);
    });
    
    test('position 누락 시 실패', () => {
      const invalid = {
        ...validSchema,
        nodes: {
          'node-1': {
            id: 'node-1',
            content: 'Test'
          }
        }
      };
      expect(validator.validate(invalid)).toBe(false);
    });
    
    test('content 타입이 string이 아니면 실패', () => {
      const invalid = {
        ...validSchema,
        nodes: {
          'node-1': {
            id: 'node-1',
            content: 123,
            position: { x: 0, y: 0 }
          }
        }
      };
      expect(validator.validate(invalid)).toBe(false);
    });
    
    test('size.width가 0이면 실패', () => {
      const invalid = {
        ...validSchema,
        nodes: {
          'node-1': {
            id: 'node-1',
            content: 'Test',
            position: { x: 0, y: 0 },
            size: { width: 0, height: 100 }
          }
        }
      };
      expect(validator.validate(invalid)).toBe(false);
    });
    
    test('style에 값 있으면 실패 (v1)', () => {
      const invalid = {
        ...validSchema,
        nodes: {
          'node-1': {
            id: 'node-1',
            content: 'Test',
            position: { x: 0, y: 0 },
            style: { color: 'red' }  // v1에서 금지!
          }
        }
      };
      expect(validator.validate(invalid)).toBe(false);
    });
  });
  
  describe('edges 검증', () => {
    test('Array면 실패', () => {
      const invalid = { ...validSchema, edges: [] };
      expect(validator.validate(invalid)).toBe(false);
    });
    
    test('Edge ID 불일치 시 실패', () => {
      const invalid = {
        ...validSchema,
        nodes: {
          'node-1': { id: 'node-1', content: 'A', position: { x: 0, y: 0 } },
          'node-2': { id: 'node-2', content: 'B', position: { x: 100, y: 0 } }
        },
        edges: {
          'edge-1': {
            id: 'edge-2',  // 불일치!
            from: 'node-1',
            to: 'node-2'
          }
        }
      };
      expect(validator.validate(invalid)).toBe(false);
    });
    
    test('from 타입이 string이 아니면 실패', () => {
      const invalid = {
        ...validSchema,
        nodes: {
          'node-1': { id: 'node-1', content: 'A', position: { x: 0, y: 0 } }
        },
        edges: {
          'edge-1': {
            id: 'edge-1',
            from: 123,
            to: 'node-1'
          }
        }
      };
      expect(validator.validate(invalid)).toBe(false);
    });
    
    test('type이 허용 범위 밖이면 실패', () => {
      const invalid = {
        ...validSchema,
        nodes: {
          'node-1': { id: 'node-1', content: 'A', position: { x: 0, y: 0 } },
          'node-2': { id: 'node-2', content: 'B', position: { x: 100, y: 0 } }
        },
        edges: {
          'edge-1': {
            id: 'edge-1',
            from: 'node-1',
            to: 'node-2',
            type: 'wavy'  // 허용 안 됨
          }
        }
      };
      expect(validator.validate(invalid)).toBe(false);
    });
  });
  
  describe('camera 검증', () => {
    test('zoom이 0이면 실패', () => {
      const invalid = {
        ...validSchema,
        camera: { x: 0, y: 0, zoom: 0 }
      };
      expect(validator.validate(invalid)).toBe(false);
    });
    
    test('NaN이면 실패', () => {
      const invalid = {
        ...validSchema,
        camera: { x: NaN, y: 0, zoom: 1 }
      };
      expect(validator.validate(invalid)).toBe(false);
    });
    
    test('zoom이 음수면 실패', () => {
      const invalid = {
        ...validSchema,
        camera: { x: 0, y: 0, zoom: -1 }
      };
      expect(validator.validate(invalid)).toBe(false);
    });
  });
  
  describe('Top-level 검증', () => {
    test('metadata 누락 시 실패', () => {
      const invalid = {
        schemaVersion: 1,
        nodes: {},
        edges: {},
        camera: { x: 0, y: 0, zoom: 1 }
      };
      expect(validator.validate(invalid)).toBe(false);
    });
    
    test('nodes 누락 시 실패', () => {
      const invalid = {
        schemaVersion: 1,
        metadata: validSchema.metadata,
        edges: {},
        camera: { x: 0, y: 0, zoom: 1 }
      };
      expect(validator.validate(invalid)).toBe(false);
    });
    
    test('null이면 실패', () => {
      expect(validator.validate(null)).toBe(false);
    });
    
    test('undefined이면 실패', () => {
      expect(validator.validate(undefined)).toBe(false);
    });
  });
  
  describe('sanitize', () => {
    test('유효하면 객체 반환', () => {
      const result = validator.sanitize(validSchema);
      expect(result).not.toBeNull();
      expect(result).toEqual(validSchema);
    });
    
    test('무효하면 null 반환', () => {
      const invalid = { invalid: 'data' };
      const result = validator.sanitize(invalid);
      expect(result).toBeNull();
    });
  });
});
