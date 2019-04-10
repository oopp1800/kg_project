import uuid from '../utils/uuid'

function KnowledgeUnit(title, _id, x, y,thumbnailUrl) {
    //知识点基本信息
    this._id = _id||'';

    this.title = title||'';
    this.thumbnailUrl = thumbnailUrl || '';
    this.root = false;

    //知识点难度和要求掌握程度
    this.demand = 0;
    this.achieve = 0;

    this.synonym = [];

    //知识点在画布上的位置
    this.position = {
        x: x||'',
        y: y||''
    };

    //是否是开始知识点
    this.isStart = false;

    //relationship
    this.hasParentNode = [];
    this.hasChildNode = [];

    this.hasRelyOnNode = [];
    this.hasBeRelyByNode = [];

    this.hasBrotherNode = [];
    this.hasParallelNode = [];
    this.hasSynonymNode = [];
    this.hasRelateNode = [];

    this.hasNextNode = [];
    this.hasPrevNode = [];

    //包含的教学单元
    this.teachUnit = new TeachUnit(this._id);
    // this.teachUnit = new TeachUnit(this.id);
}


function TeachUnit(kUnitId) {
    //教学单元基本信息
    this._id = uuid();
    this.keyword = [];
    this.status = '';
    this.description = '';
    this.title = '';
    this.knowledgeUnitId = kUnitId || '';

    //课时信息
    this.mCourseUnit = new Course('main',this._id);
    this.aCourseUnit = [];

    //学生信息
    this.student = [];

    //评论信息
    this.comments = [];
}

function Course(type, teachUnitId) {
    this._id = uuid();
    this.type = type;                   // 'aid': 辅课时；'main': 主课时
    this.title = '';
    this.duration = 0;

    this.interactionDegree = '';
    this.interactionType = '';

    this.clickNum = 0;
    this.difficulty = '';
    this.watchNum = 0;

    this.material = '';
    this.learningObjectType = '';
    this.averageRetentionRate = 0;
    this.semanticDensity = 0;

    this.teachUnitId = teachUnitId;
}

export {KnowledgeUnit, TeachUnit, Course}