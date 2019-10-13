class VertexDebugger{
    constructor(gl,pntSize){
        this.transform = new Transform();
        this.gl = gl;
        this.mColor = [];
        this.mVerts = [];
        this.mVertBuffer = 0;
    }
}