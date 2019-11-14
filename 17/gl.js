//--------------------------------------------------
// Global Constants 
//--------------------------------------------------
const ATTR_POSITION_NAME	= "a_position";
const ATTR_POSITION_LOC		= 0;
const ATTR_NORMAL_NAME		= "a_norm";
const ATTR_NORMAL_LOC		= 1;
const ATTR_UV_NAME			= "a_uv";
const ATTR_UV_LOC			= 2;

class GlUtil{
	static rgbArray(){
		if(arguments.length === 0) return null;
		var rtn = [];

		for(var i=0,c,p;i<arguments.length;i++){
			if(arguments[i].length<6) continue;
			c = arguments[i];
			p = (c[0]==="#")?1:0;

			rtn.push(
				parseInt(c[p]+c[p+1],16)/255,
				parseInt(c[p+2]+c[p+3],16)/255,
				parseInt(c[p+4]+c[p+5],16)/255,
			);
		}
		return rtn;
	}
}
//--------------------------------------------------
// Custom GL Context Object
//--------------------------------------------------
function GLInstance(canvasID){
	var canvas = document.getElementById(canvasID),
		gl = canvas.getContext("webgl2");

	if(!gl){ console.error("WebGL context is not available."); return null; }

	//...................................................
	//Setup custom properties
	gl.mMeshCache = [];	//Cache all the mesh structs, easy to unload buffers if they all exist in one place.
	gl.mTextureCache = [];

	gl.cullFace(gl.BACK);//设置后向剔除面
	gl.frontFace(gl.CCW);//逆时针绘制的面为前面
	gl.enable(gl.DEPTH_TEST);//开启深度检测
	gl.enable(gl.CULL_FACE);//开启后向剔除
	gl.depthFunc(gl.LEQUAL);//深度检测函数
	gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);//颜色混合函数
	//...................................................
	//Setup GL, Set all the default configurations we need.
	gl.clearColor(1.0,1.0,1.0,1.0);		//Set clear color


	//...................................................
	//Methods
	
	//Reset the canvas with our set background color.	
	gl.fClear = function(){ this.clear(this.COLOR_BUFFER_BIT | this.DEPTH_BUFFER_BIT); return this; }

	//Create and fill our Array buffer.
	gl.fCreateArrayBuffer = function(floatAry,isStatic){
		if(isStatic === undefined) isStatic = true; //So we can call this function without setting isStatic

		var buf = this.createBuffer();
		this.bindBuffer(this.ARRAY_BUFFER,buf);
		this.bufferData(this.ARRAY_BUFFER, floatAry, (isStatic)? this.STATIC_DRAW : this.DYNAMIC_DRAW );
		this.bindBuffer(this.ARRAY_BUFFER,null);
		return buf;
	}

	//Turns arrays into GL buffers, then setup a VAO that will predefine the buffers to standard shader attributes.
	gl.fCreateMeshVAO = function(name,aryInd,aryVert,aryNorm,aryUV,vertLen){
		var rtn = { drawMode:this.TRIANGLES };

		//Create and bind vao
		rtn.vao = this.createVertexArray();															
		this.bindVertexArray(rtn.vao);	//Bind it so all the calls to vertexAttribPointer/enableVertexAttribArray is saved to the vao.

		//.......................................................
		//Set up vertices
		if(aryVert !== undefined && aryVert != null){
			rtn.bufVertices = this.createBuffer();													//Create buffer...
			rtn.vertexComponentLen = vertLen||3;																//How many floats make up a vertex
			rtn.vertexCount = aryVert.length / rtn.vertexComponentLen;								//How many vertices in the array

			this.bindBuffer(this.ARRAY_BUFFER, rtn.bufVertices);
			this.bufferData(this.ARRAY_BUFFER, new Float32Array(aryVert), this.STATIC_DRAW);		//then push array into it.
			this.enableVertexAttribArray(ATTR_POSITION_LOC);										//Enable Attribute location
			this.vertexAttribPointer(ATTR_POSITION_LOC,rtn.vertexComponentLen,this.FLOAT,false,0,0);						//Put buffer at location of the vao
		}

		//.......................................................
		//Setup normals
		if(aryNorm !== undefined && aryNorm != null){
			rtn.bufNormals = this.createBuffer();
			this.bindBuffer(this.ARRAY_BUFFER, rtn.bufNormals);
			this.bufferData(this.ARRAY_BUFFER, new Float32Array(aryNorm), this.STATIC_DRAW);
			this.enableVertexAttribArray(ATTR_NORMAL_LOC);
			this.vertexAttribPointer(ATTR_NORMAL_LOC,3,this.FLOAT,false, 0,0);
		}

		//.......................................................
		//Setup UV
		if(aryUV !== undefined && aryUV != null){
			rtn.bufUV = this.createBuffer();
			this.bindBuffer(this.ARRAY_BUFFER, rtn.bufUV);
			this.bufferData(this.ARRAY_BUFFER, new Float32Array(aryUV), this.STATIC_DRAW);
			this.enableVertexAttribArray(ATTR_UV_LOC);
			this.vertexAttribPointer(ATTR_UV_LOC,2,this.FLOAT,false,0,0);	//UV only has two floats per component
		}

		//.......................................................
		//Setup Index.
		if(aryInd !== undefined && aryInd != null){
			rtn.bufIndex = this.createBuffer();
			rtn.indexCount = aryInd.length;
			this.bindBuffer(this.ELEMENT_ARRAY_BUFFER, rtn.bufIndex);
			this.bufferData(this.ELEMENT_ARRAY_BUFFER, new Uint16Array(aryInd), this.STATIC_DRAW);
			// this.bindBuffer(this.ELEMENT_ARRAY_BUFFER,null);
		}

		//Clean up
		this.bindVertexArray(null);					//Unbind the VAO, very Important. always unbind when your done using one.
		this.bindBuffer(this.ARRAY_BUFFER,null);	//Unbind any buffers that might be set
		if(aryInd != null && aryInd !== undefined)  this.bindBuffer(this.ELEMENT_ARRAY_BUFFER,null);
		
		this.mMeshCache[name] = rtn;
		return rtn;
	}

	gl.fLoadTexture = function(name,img,doYFlip,noMips){
        var tex = this.createTexture();
        this.mTextureCache[name] = tex;
        return this.fUpdateTexture(name,img,doYFlip,noMips);
    }
    
    gl.fUpdateTexture = function(name,img,doYFlip,noMips){
        var tex = this.mTextureCache[name];
        if(doYFlip === true){//Blender可能导出的texture是flipY的
			this.pixelStorei(this.UNPACK_FLIP_Y_WEBGL,true);
		}
		this.bindTexture(this.TEXTURE_2D, tex);
		this.texImage2D(this.TEXTURE_2D, 0, this.RGBA, this.RGBA, this.UNSIGNED_BYTE,img);

        if(noMips===undefined || noMips === false){
            this.texParameteri(this.TEXTURE_2D, this.TEXTURE_MAG_FILTER, this.LINEAR);
            this.texParameteri(this.TEXTURE_2D, this.TEXTURE_MIN_FILTER, this.LINEAR_MIPMAP_NEAREST);
            this.generateMipmap(this.TEXTURE_2D);
        }
        else{
            // this.texParameteri(this.TEXTURE_2D, this.TEXTURE_MAG_FILTER, this.NEARSET);
            this.texParameteri(this.TEXTURE_2D, this.TEXTURE_MIN_FILTER, this.LINEAR);//不能写NEAREST，否则videoTexture会clip掉
            this.texParameteri(this.TEXTURE_2D, this.TEXUTRE_WRAP_S, this.CLAMP_TO_EDGE);
            this.texParameteri(this.TEXTURE_2D, this.TEXUTRE_WRAP_T, this.CLAMP_TO_EDGE);
        }
		
		this.bindTexture(this.TEXTURE_2D,null);
		

		if(doYFlip === true){//Blender可能导出的texture是flipY的
			this.pixelStorei(this.UNPACK_FLIP_Y_WEBGL,false);
        }
        return tex;
    }

	gl.fLoadCubeMap = function(name,imgAry){
		if(imgAry.length!==6) return null;

		var tex = this.createTexture();
		this.bindTexture(this.TEXTURE_CUBE_MAP,tex);

		for(var i=0;i<6; i++){//图片顺序right,left,top,bottom,back,front
			this.texImage2D(this.TEXTURE_CUBE_MAP_POSITIVE_X+i,0,this.RGBA,this.RGBA,this.UNSIGNED_BYTE,imgAry[i]);
		}

		this.texParameteri(this.TEXTURE_CUBE_MAP,this.TEXTURE_MAG_FILTER, this.LINEAR);
		this.texParameteri(this.TEXTURE_CUBE_MAP,this.TEXTURE_MIN_FILTER, this.LINEAR);
		this.texParameteri(this.TEXTURE_CUBE_MAP,this.TEXUTRE_WRAP_S, this.CLAMP_TO_EDGE);
		this.texParameteri(this.TEXTURE_CUBE_MAP,this.TEXUTRE_WRAP_T, this.CLAMP_TO_EDGE);
		this.texParameteri(this.TEXTURE_CUBE_MAP,this.TEXUTRE_WRAP_R, this.CLAMP_TO_EDGE);//图片在Z方向的拉伸

		this.bindTexture(this.TEXTURE_CUBE_MAP,null);
		this.mTextureCache[name] = tex;
		return tex;
	}
	//...................................................
	//Setters - Getters

	//Set the size of the canvas html element and the rendering view port
	gl.fSetSize = function(w,h){
		//set the size of the canvas, on chrome we need to set it 3 ways to make it work perfectly.
		this.canvas.style.width = w + "px";
		this.canvas.style.height = h + "px";
		this.canvas.width = w;
		this.canvas.height = h;

		//when updating the canvas size, must reset the viewport of the canvas 
		//else the resolution webgl renders at will not change
		this.viewport(0,0,w,h);
		return this;
	}

	gl.fFitScreen = function(wp,hp){
		return this.fSetSize(window.innerWidth * (wp||1),window.innerHeight *(hp||1));
	}

	return gl;
}