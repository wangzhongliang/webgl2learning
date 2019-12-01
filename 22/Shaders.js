class Shader{
	constructor(gl,vertShaderSrc,fragShaderSrc){
		this.program = ShaderUtil.createProgramFromText(gl,vertShaderSrc,fragShaderSrc,true);

		if(this.program != null){
			this.gl = gl;
			gl.useProgram(this.program);
			this.attribLoc = ShaderUtil.getStandardAttribLocations(gl,this.program);
			this.uniformLoc = ShaderUtil.getStandardUniformLocations(gl,this.program);
		}

		//Note :: Extended shaders should deactivate shader when done calling super and setting up custom parts in the constructor.
	}

	//...................................................
	//Methods
	activate(){ this.gl.useProgram(this.program); return this; }
    deactivate(){ this.gl.useProgram(null); return this; }
    
    setPerspective(matData){
        this.gl.uniformMatrix4fv(this.uniformLoc.perspective, false, matData);
        return this;
    }

    setModalMatrix(matData){
        this.gl.uniformMatrix4fv(this.uniformLoc.modelMatrix, false, matData);
        return this;
    }

    setCameraMatrix(matData){
        this.gl.uniformMatrix4fv(this.uniformLoc.cameraMatrix, false, matData);
        return this;
    }

	//function helps clean up resources when shader is no longer needed.
	dispose(){
		//unbind the program if its currently active
		if(this.gl.getParameter(this.gl.CURRENT_PROGRAM) === this.program) this.gl.useProgram(null);
		this.gl.deleteProgram(this.program);
	}

	//...................................................
	//RENDER RELATED METHODS

	//Setup custom properties
	preRender(){} //abstract method, extended object may need need to do some things before rendering.

	//Handle rendering a modal
	renderModal(modal){
        this.setModalMatrix(modal.transform.getViewMatrix())
		this.gl.bindVertexArray(modal.mesh.vao);	//Enable VAO, this will set all the predefined attributes for the shader
		
		if(modal.mesh.noCulling) this.gl.disable(this.gl.CULL_FACE);
		if(modal.mesh.doBlending) this.gl.enable(this.gl.BLEND);
		
		if(modal.mesh.indexCount) this.gl.drawElements(modal.mesh.drawMode, modal.mesh.indexCount, gl.UNSIGNED_SHORT, 0);
		else this.gl.drawArrays(modal.mesh.drawMode, 0, modal.mesh.vertexCount);

		this.gl.bindVertexArray(null);
		if(modal.mesh.noCulling) this.gl.enable(this.gl.CULL_FACE);
		if(modal.mesh.doBlending) this.gl.disable(this.gl.BLEND);

		return this;
	}
}


class ShaderUtil{
	//-------------------------------------------------
	// Main utility functions
	//-------------------------------------------------

	//get the text of a script tag that are storing shader code.
	static domShaderSrc(elmID){
		var elm = document.getElementById(elmID);
		if(!elm || elm.text == ""){ console.log(elmID + " shader not found or no text."); return null; }
		
		return elm.text;
	}

	//Create a shader by passing in its code and what type
	static createShader(gl,src,type){
		var shader = gl.createShader(type);
		gl.shaderSource(shader,src);
		gl.compileShader(shader);

		//Get Error data if shader failed compiling
		if(!gl.getShaderParameter(shader, gl.COMPILE_STATUS)){
			console.error("Error compiling shader : " + src, gl.getShaderInfoLog(shader));
			gl.deleteShader(shader);
			return null;
		}

		return shader;
	}

	//Link two compiled shaders to create a program for rendering.
	static createProgram(gl,vShader,fShader,doValidate){
		//Link shaders together
		var prog = gl.createProgram();
		gl.attachShader(prog,vShader);
		gl.attachShader(prog,fShader);

		//Force predefined locations for specific attributes. If the attibute isn't used in the shader its location will default to -1
		gl.bindAttribLocation(prog,ATTR_POSITION_LOC,ATTR_POSITION_NAME);
		gl.bindAttribLocation(prog,ATTR_NORMAL_LOC,ATTR_NORMAL_NAME);
		gl.bindAttribLocation(prog,ATTR_UV_LOC,ATTR_UV_NAME);

		gl.linkProgram(prog);

		//Check if successful
		if(!gl.getProgramParameter(prog, gl.LINK_STATUS)){
			console.error("Error creating shader program.",gl.getProgramInfoLog(prog));
			gl.deleteProgram(prog); return null;
		}

		//Only do this for additional debugging.
		if(doValidate){
			gl.validateProgram(prog);
			if(!gl.getProgramParameter(prog,gl.VALIDATE_STATUS)){
				console.error("Error validating program", gl.getProgramInfoLog(prog));
				gl.deleteProgram(prog); return null;
			}
		}
		
		//Can delete the shaders since the program has been made.
		gl.detachShader(prog,vShader); //TODO, detaching might cause issues on some browsers, Might only need to delete.
		gl.detachShader(prog,fShader);
		gl.deleteShader(fShader);
		gl.deleteShader(vShader);

		return prog;
	}

	//-------------------------------------------------
	// Helper functions
	//-------------------------------------------------
	
	//Pass in Script Tag IDs for our two shaders and create a program from it.
	static domShaderProgram(gl,vectID,fragID,doValidate){
		var vShaderTxt	= ShaderUtil.domShaderSrc(vectID);								if(!vShaderTxt)	return null;
		var fShaderTxt	= ShaderUtil.domShaderSrc(fragID);								if(!fShaderTxt)	return null;
		var vShader		= ShaderUtil.createShader(gl,vShaderTxt,gl.VERTEX_SHADER);		if(!vShader)	return null;
		var fShader		= ShaderUtil.createShader(gl,fShaderTxt,gl.FRAGMENT_SHADER);	if(!fShader){	gl.deleteShader(vShader); return null; }
		
		return ShaderUtil.createProgram(gl,vShader,fShader,true);
	}

	static createProgramFromText(gl,vShaderTxt,fShaderTxt,doValidate){
		var vShader		= ShaderUtil.createShader(gl,vShaderTxt,gl.VERTEX_SHADER);		if(!vShader)	return null;
		var fShader		= ShaderUtil.createShader(gl,fShaderTxt,gl.FRAGMENT_SHADER);	if(!fShader){	gl.deleteShader(vShader); return null; }
		
		return ShaderUtil.createProgram(gl,vShader,fShader,true);
	}

	//-------------------------------------------------
	// Setters / Getters
	//-------------------------------------------------

	//Get the locations of standard Attributes that we will mostly be using. Location will = -1 if attribute is not found.
	static getStandardAttribLocations(gl,program){
		return {
			position:	gl.getAttribLocation(program,ATTR_POSITION_NAME),
			norm:		gl.getAttribLocation(program,ATTR_NORMAL_NAME),
			uv:			gl.getAttribLocation(program,ATTR_UV_NAME)
		};
    }
    
    static getStandardUniformLocations(gl,program){
        return {
            perspective: gl.getUniformLocation(program,"uPMatrix"),
            modelMatrix: gl.getUniformLocation(program,"uMVMatrix"),
            cameraMatrix: gl.getUniformLocation(program,"uCameraMatrix"),
            mainTexture: gl.getUniformLocation(program,"uMainTex")
        }
    }
}

class ShaderBuilder{
    constructor(gl, vertShader,fragShader){
        if(vertShader.length<20){//当传入dom名称时
            this.program = ShaderUtil.domShaderProgram(gl,vertShader,fragShader,true);
        }
        else{
            this.program = ShaderUtil.createProgramFromText(gl,vertShader,fragShader,true);
        }

        if(this.program != null){
            this.gl = gl;
            gl.useProgram(this.program);
            this.mUniformList = {};
            this.mTextureList = [];

            this.noCulling = false;
            this.doBlending = false;
        }
    }

    //预先定义uniform的名字和类型，如传入"uColors","3fv"，存入location和type
    prepareUniforms(){
        if(arguments.length % 2 != 0){
            console.log("uniform参数必须成对传入");
            return this;
        }
        var loc = 0;
        for(var i=0;i<arguments.length; i+=2){
            loc = gl.getUniformLocation(this.program, arguments[i]);
            if(loc != null) this.mUniformList[arguments[i]] = {loc:loc, type:arguments[i+1]};
        }
        return this;
    }

    //使用uniform buffer object
    prepareUniformBlocks(ubo,blockIndex){
        // var ind = 0;
        for(var i=0;i<arguments.length;i+=2){
            this.gl.uniformBlockBinding(this.program, arguments[i+1], arguments[i].blockPoint);
            console.log("PREPARE UNIFORM BLOCK ",this.gl.getActiveUniformBlockParameter(this.program, 0, this.gl.UNIFORM_BLOCK_DATA_SIZE)); //Get Size of Uniform Block
        }
        return this;
    }

    //预定定义texture的名字，如传入"uMask01"，"tex"（缓存中的名字），存入location和tex
    prepareTextures(){
        if(arguments.length % 2 != 0){
            console.log("texture参数必须成对传入");
            return this;
        }

        var loc = 0, tex = "";
        for(var i=0; i<arguments.length; i+=2){
            tex = this.gl.mTextureCache[arguments[i+1]];
            if(tex === undefined){
                console.log("Texture " + arguments[i+1] +"不在缓存中");
                continue;
            }
            loc = gl.getUniformLocation(this.program, arguments[i]);
            if(loc != null){
                this.mTextureList.push({
                    loc:loc,
                    tex:tex
                });
            }
        }
        return this;
    }

    setUniforms(){
        if(arguments.length % 2 != 0){
            console.log("uniform参数必须成对传入");
            return this;
        }

        var name;
        for(var i=0;i<arguments.length;i+=2){
            name = arguments[i];
            if(this.mUniformList[name] === undefined){
                console.log("uniform"+name+"不存在");
                return this;
            }

            switch(this.mUniformList[name].type){
                case "2fv":
                    this.gl.uniform2fv(this.mUniformList[name].loc,new Float32Array(arguments[i+1]));
                    break;
                case "3fv":
                    this.gl.uniform3fv(this.mUniformList[name].loc, new Float32Array(arguments[i+1]));
                    break;
                case "4fv":
                    this.gl.uniform4fv(this.mUniformList[name].loc, new Float32Array(arguments[i+1]));
                    break;
                case "mat4":
                    this.gl.uniformMatrix4fv(this.mUniformList[name].loc, false, arguments[i+1]);
                    break;
                case "mat3":
                    this.gl.uniformMatrix3fv(this.mUniformList[name].loc, false, arguments[i+1]);
                    break;
                default:
                    console.log("未知的uniform类型:"+name);
                    break;
            }
        }
        return this;
    }

    activate(){
        this.gl.useProgram(this.program);
        return this;
    }

    deactivate(){
        this.gl.useProgram(null);
        return this;
    }

    dispose(){
        if(this.gl.getParameter(this.gl.CURRENT_PROGRAM)===this.program){
            this.gl.useProgram(null);
        }
        this.gl.deleteProgram(this.program);
    }

    preRender(){
        this.gl.useProgram(this.program);
        if(arguments.length>0){
            this.setUniforms.apply(this,arguments);
        }
        if(this.mTextureList.length>0){
            var texSlot;
            for(var i=0;i<this.mTextureList.length;i++){
                texSlot = this.gl["TEXTURE"+i];
                this.gl.activeTexture(texSlot);
                this.gl.bindTexture(this.gl.TEXTURE_2D,this.mTextureList[i].tex);
                this.gl.uniform1i(this.mTextureList[i].loc, i);
            }
        }
        return this;
    }

    rednerModel(model, doShaderClose){
        this.setUniforms("uMVMatrix",model.transform.getViewMatrix());
        this.gl.bindVertexArray(model.mesh.vao);

        if(model.mesh.noCulling || this.noCulling) this.gl.disable(this.gl.CULL_FACE);
        if(model.mesh.doBlending || this.doBlending) this.gl.enable(this.gl.BLEND);

        if(model.mesh.indexCount) this.gl.drawElements(model.mesh.drawMode, model.mesh.indexCount, gl.UNSIGNED_SHORT,0);
        else this.gl.drawArrays(model.mesh.drawMode,0,model.mesh.vertexCount);

        this.gl.bindVertexArray(null);
        if(model.mesh.noCulling || this.noCulling) this.gl.enable(this.gl.CULL_FACE);
        if(model.mesh.doBlending || this.doBlending) this.gl.disable(this.gl.BLEND);

        if(doShaderClose) this.gl.useProgram(null);

        return this;
    }
}

class UBO{
    constructor(gl,blockName,blockPoint,bufSize,aryCalc){
        this.items = [];
        this.keys = [];

        for(var i=0;i<aryCalc.length;i++){
            this.items[aryCalc[i].name] = {offset: aryCalc[i].offset, dataLen: aryCalc[i].dataLen, chunkLen:aryCalc[i].chunkLen};
            this.keys[i] = aryCalc[i].name;
        }

        this.gl = gl;
        this.blockName = blockName;
        this.blockPoint = blockPoint;

        this.buf = gl.createBuffer();
        gl.bindBuffer(gl.UNIFORM_BUFFER,this.buf);
        gl.bufferData(gl.UNIFORM_BUFFER,bufSize,gl.DYNAMIC_DRAW);
        gl.bindBuffer(gl.UNIFORM_BUFFER,null);
        gl.bindBufferBase(gl.UNIFORM_BUFFER,blockPoint,this.buf);
    }

    update(name,data){
        if(!data instanceof Float32Array){
            if(Array.isArray(data)) data = new Float32Array(data);
            else data = new Float32Array([data]);
        }
        this.gl.bindBuffer(this.gl.UNIFORM_BUFFER,this.buf);
        this.gl.bufferSubData(this.gl.UNIFORM_BUFFER,this.items[name].offset,data,0,null);
        this.gl.bindBuffer(this.gl.UNIFORM_BUFFER,null);
        return this;
    }
    static create(gl,blockName,blockPoint,ary){
        var bufSize = UBO.calculate(ary);
        UBO.Cache[blockName] = new UBO(gl,blockName,blockPoint,bufSize,ary);
        UBO.debugVisualize(UBO.Cache[blockName]);
    }

    static getSize(type){//[Alignment,Size]
        switch(type){
			case "f": case "i": case "b": return [4,4];
			case "mat4": return [64,64]; //16*4
			case "mat3": return [48,48]; //16*3
			case "vec2": return [8,8];
			case "vec3": return [16,12]; //Special Case
			case "vec4": return [16,16];
			default: return [0,0];
		}
    }

    static calculate(ary){
        var chunk = 16,
        tsize = 0,
        offset = 0,
        size;

        for(var i=0;i<ary.length;i++){
            if(!ary[i].arylen || ary[i].arylen===0) size = UBO.getSize(ary[i].type);
            else size = [ary[i].arylen * 16,ary[i].arylen * 16];

            tsize = chunk-size[0];

            if(tsize<0 && chunk<16){
                offset += chunk;
                if(i>0) ary[i-1].chunkLen += chunk;
                chunk = 16;
            }
            else if(tsize<0 && chunk ===16){

            }
            else if(tsize ===0){
                if(ary[i].type == "vec3" && chunk == 16) chunk -= size[1];	//If Vec3 is the first var in the chunk, subtract size since size and alignment is different.
				else chunk = 16;
            }
            else chunk -=size[1];

            ary[i].offset = offset;
            ary[i].chunkLen = size[1];
            ary[i].dataLen = size[1];

            offset+=size[1];
        }

        // if(offset % 16 !==0){
        //     ary[ary.length-1].chunkLen +=chunk;
        //     offset += chunk;
        // }
        console.log("UBO Buffer Size ",offset);
        return offset;
    }

    static debugVisualize(ubo){
		var str = "",
			chunk = 0,
			tchunk = 0,
			itm = null;

		for(var i=0; i < ubo.keys.length; i++){
			itm = ubo.items[ubo.keys[i]];
			console.log(ubo.keys[i],itm);

			chunk = itm.chunkLen / 4;
			for(var x = 0; x < chunk; x++){
				str += (x==0 || x == chunk-1)? "|."+i+"." : "|...";	//Display the index
				tchunk++;
				if(tchunk % 4 == 0) str += "| ~ ";
			}
		}

		if(tchunk % 4 != 0) str += "|";

		console.log(str);
		//for(var i=0; i < ary.length; i++) console.log(ary[i]);
	}
}

UBO.Cache = [];