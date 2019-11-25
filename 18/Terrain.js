class Terrain{
    static createModel(gl,keepRawData){
        return new Model(Terrain.createMesh(gl,10,10,20,20,keepRawData));
    }
    static createMesh(gl,w,h,rLen,cLen,keepRawData){
        let rStart = w / -2,
        cStart = h / -2,
        vLen = rLen * cLen,
        iLen = (rLen-1)*cLen,
        cInc = w /(cLen-1),
        rInc = h /(rLen-1),
        cRow = 0,
        cCol = 0,
        aVert = [],
        aIndex=[],
        aUV = [],
        uvxInc = 1/(cLen-1),
        uvyInc = 1/(rLen-1);

        noise.seed(1);
        let height=0,
        freq = 13,
        maxHeight=-3;

        for(let i=0;i<vLen;i++){
            cRow = Math.floor(i/cLen);
            cCol = i%cLen;
            height = noise.perlin2((cRow+1)/freq,(cCol+1)/freq) * maxHeight;
            aVert.push(cStart+cCol*cInc, height, rStart+cRow*rInc);

            aUV.push((cCol == cLen-1)?1:cCol*uvxInc,
                (cRow == rLen-1)?1:cRow*uvyInc);
            if(i<iLen){
                aIndex.push(cRow * cLen +cCol, (cRow+1) * cLen+cCol);
                if(cCol==cLen-1 && i<iLen-1){
                    aIndex.push((cRow+1)*cLen+cCol, (cRow+1)*cLen);//下一行尾部和头部顶点相连
                }
            }
        }

        let mesh = gl.fCreateMeshVAO("Terrain",aIndex,aVert,null,aUV,3);
        mesh.drawMode = gl.TRIANGLE_STRIP;

        return mesh;
    }
}