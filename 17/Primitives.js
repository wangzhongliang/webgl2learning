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

Primitives.Quad = class {
    static createModal(gl){
        return new Modal(Primitives.Quad.createMesh(gl));
    }
    static createMesh(gl){
        var aVert = [-0.5,0.5,0,  -0.5,-0.5,0,  0.5,-0.5,0, 0.5,0.5,0],
            aUV = [0,0,  0,1,  1,1,  1,0],
            aIndex = [0,1,2,  2,3,0];
        var mesh = gl.fCreateMeshVAO("Quad",aIndex,aVert,null,aUV);
        mesh.noCulling = true;
        mesh.doBlending = true;
        return mesh;
    }
}

Primitives.MultiQuad = class {
    static createModal(gl){
        return new Modal(Primitives.MultiQuad.createMesh(gl));
    }
    static createMesh(gl){
        var aIndex = [],
            aUV = [],
            aVert = [];

        for(var i=0;i<100;i++){
            var size = 0.2 * (0.8* Math.random()),
                half = size * 0.5,
                angle = Math.PI * 2 * Math.random(),
                dx = half * Math.cos(angle),
                dy = half * Math.sin(angle),
                x = -1+Math.random()*2,
                y = -1+Math.random()*2,
                z = -1+Math.random()*2,
                p = i * 4;

            aVert.push(x-dx, y+half, z-dy);
            aVert.push(x-dx, y-half, z-dy);
            aVert.push(x+dx, y-half, z+dy);
            aVert.push(x+dx, y+half, z+dy);


            aUV.push(0,0,  0,1,  1,1,  1,0),
            aIndex.push(p,p+1,p+2,  p+2,p+3,p);
        }

        var mesh = gl.fCreateMeshVAO("MultiQuad",aIndex,aVert,null,aUV);
        mesh.noCulling = true;
        mesh.doBlending = true;
        return mesh;
    }
}

Primitives.CubeBad = class{
    static createModal(gl){
        return new Modal(Primitives.CubeBad.createMesh(gl));
    }
    static createMesh(gl){
        var aVert = [//position+colorIndex
            -0.5,0.5,0,0, -0.5,-0.5,0,1, 0.5,-0.5,0,2, 0.5,0.5,0,3,			//Front
            0.5,0.5,-1,4, 0.5,-0.5,-1,5, -0.5,-0.5,-1,0, -0.5,0.5,-1,1		//Back
        ],
        aUV = [
            0,0, 0,1, 1,1, 1,0, 
            0,0, 0,1, 1,1, 1,0
        ],
        aIndex = [
            0,1,2, 2,3,0, //Front
             4,5,6, 6,7,4, //Back
             3,2,5, 5,4,3, //Right
             7,0,3, 3,4,7, //Top
             7,6,1, 1,0,7  //Left
         ];
        return gl.fCreateMeshVAO("Cube",aIndex,aVert,null,aUV,4);
    }
}

Primitives.Cube = class{
    static createModel(gl,name,keepRawData){
        return new Model(Primitives.Cube.createMesh(gl,name||"Cube",1,1,1,0,0,0,keepRawData));
    }
    static createMesh(gl,name,width,height,depth,x,y,z,keepRawData){
        var w = width*0.5, h = height*0.5, d = depth*0.5;
		var x0 = x-w, x1 = x+w, y0 = y-h, y1 = y+h, z0 = z-d, z1 = z+d;

		//Starting bottom left corner, then working counter clockwise to create the front face.
		//Backface is the first face but in reverse (3,2,1,0)
		//keep each quad face built the same way to make index and uv easier to assign
		var aVert = [
			x0, y1, z1, 0,	//0 Front
			x0, y0, z1, 0,	//1
			x1, y0, z1, 0,	//2
			x1, y1, z1, 0,	//3 

			x1, y1, z0, 1,	//4 Back
			x1, y0, z0, 1,	//5
			x0, y0, z0, 1,	//6
			x0, y1, z0, 1,	//7 

			x0, y1, z0, 2,	//7 Left
			x0, y0, z0, 2,	//6
			x0, y0, z1, 2,	//1
			x0, y1, z1, 2,	//0

			x0, y0, z1, 3,	//1 Bottom
			x0, y0, z0, 3,	//6
			x1, y0, z0, 3,	//5
			x1, y0, z1, 3,	//2

			x1, y1, z1, 4,	//3 Right
			x1, y0, z1, 4,	//2 
			x1, y0, z0, 4,	//5
			x1, y1, z0, 4,	//4

			x0, y1, z0, 5,	//7 Top
			x0, y1, z1, 5,	//0
			x1, y1, z1, 5,	//3
			x1, y1, z0, 5	//4
		];

		//Build the index of each quad [0,1,2, 2,3,0]
		var aIndex = [];
		for(var i=0; i < aVert.length / 4; i+=2) aIndex.push(i, i+1, (Math.floor(i/4)*4)+((i+2)%4));

		//Build UV data for each vertex
		var aUV = [];
		for(var i=0; i < 6; i++) aUV.push(0,0,	0,1,  1,1,  1,0);

		//Build Normal data for each vertex
		var aNorm = [
			 0, 0, 1,	 0, 0, 1,	 0, 0, 1,	 0, 0, 1,		//Front
			 0, 0,-1,	 0, 0,-1,	 0, 0,-1,	 0, 0,-1,		//Back
			-1, 0, 0,	-1, 0, 0,	-1, 0,0 ,	-1, 0, 0,		//Left
			 0,-1, 0,	 0,-1, 0,	 0,-1, 0,	 0,-1, 0,		//Bottom
			 1, 0, 0,	 1, 0, 0,	 1, 0, 0,	 1, 0, 0,		//Right
			 0, 1, 0,	 0, 1, 0,	 0, 1, 0,	 0, 1, 0		//Top
		]

        var mesh = gl.fCreateMeshVAO(name,aIndex,aVert,aNorm,aUV,4);
		mesh.noCulling = true;	//TODO Only setting this true to view animations better.
        if(keepRawData){ //Have the option to save the data to use for normal debugging or modifying.
			mesh.aIndex	= aIndex;
			mesh.aVert	= aVert;
			mesh.aNorm	= aNorm;
		}
        return mesh;
    }
}