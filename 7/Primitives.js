var Primitives = {};
Primitives.GridAxis = class {
    static createModal(gl,incAxis){
        return new Modal(Primitives.GridAxis.createMesh(gl,incAxis));
    }
    static createMesh(gl,incAxis){
        var verts = [],
            size = 1.8,
            div = 10.0,
            step = size/div,
            half = size/2;

        var p;
        for(var i=0; i<=div; i++){
            p = -half + (i*step);
            verts.push(p);
            verts.push(0);
            verts.push(half);
            verts.push(0);

            verts.push(p);
            verts.push(0);
            verts.push(-half);
            verts.push(0);

            p = half-(i*step);
            verts.push(-half);
            verts.push(0);
            verts.push(p);
            verts.push(0);

            verts.push(half);
            verts.push(0);
            verts.push(p);
            verts.push(0);
        }

        if(incAxis){
            //x轴
            verts.push(0);
            verts.push(0);
            verts.push(0);
            verts.push(1);

            verts.push(half);
            verts.push(0);
            verts.push(0);
            verts.push(1);

            //y轴
            verts.push(0);
            verts.push(0);
            verts.push(0);
            verts.push(2);

            verts.push(0);
            verts.push(half);
            verts.push(0);
            verts.push(2);

            //z轴
            verts.push(0);
            verts.push(0);
            verts.push(0);
            verts.push(3);

            verts.push(0);
            verts.push(0);
            verts.push(half);
            verts.push(3);
        }
        

        var attrColorLoc = 4,
            strideLen,
            mesh = {drawMode:gl.LINES, vao: gl.createVertexArray()};

        mesh.vertexComponentLen = 4;
        mesh.vertexCount = verts.length/mesh.vertexComponentLen;
        strideLen = Float32Array.BYTES_PER_ELEMENT * mesh.vertexComponentLen;//单个attribute的字节长度

        mesh.bufVertices = gl.createBuffer();
        gl.bindVertexArray(mesh.vao);
        gl.bindBuffer(gl.ARRAY_BUFFER,mesh.bufVertices);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(ATTR_POSITION_LOC);
        gl.enableVertexAttribArray(attrColorLoc);

        gl.vertexAttribPointer(//要从当前绑定的buffer里取attribute，就要指定它在buffer里哪一块
            ATTR_POSITION_LOC,//attribute的地址
            3,
            gl.FLOAT,
            false,
            strideLen,
            0
        );

        gl.vertexAttribPointer(
            attrColorLoc,
            1,
            gl.FLOAT,
            false,
            strideLen,
            Float32Array.BYTES_PER_ELEMENT*3//attribute在块中的位置
        );

        gl.bindVertexArray(null);
        gl.bindBuffer(gl.ARRAY_BUFFER,null);
        gl.mMeshCache["grid"] = mesh;
        return mesh;
    }
}