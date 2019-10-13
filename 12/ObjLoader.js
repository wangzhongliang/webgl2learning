class ObjLoader{
    static domToMesh(meshName,elmID,flipYUV){
        var objects= ObjLoader.parseFromDom(elmID,flipYUV);
        var rtn = [];
        for(var name in objects){
            var data = objects[name];
            var mesh = gl.fCreateMeshVAO(name||meshName,data[0],data[1],data[2],data[3],3);
            if(keepRawData){
                mesh.aIndex = data[0];
                mesh.aVert = data[1];
                mesh.aNorm = data[2];
            }
            rtn.push();
        }
        return rtn;
    }

    static parseFromDom(elmID,flipYUV){
        return ObjLoader.parseObjText(document.getElementById(elmID).innerHTML,flipYUV);
    }

    static parseObjText(txt,flipYUV){
        txt = txt.trim()+"\n";

        var line,
        itm,
        ary,
        i,
        ind,
        isQuad = false,
        aCache = [],
        cVert = [],
        cNorm = [],
        cUV = [],
        fVert = [],
        fNorm = [],
        fUV = [],
        fIndex = [],
        fIndexCnt = 0,
        posA = 0,
        posB = txt.indexOf("\n",0),
        objects = [],
        currentObjName;
        while(posB>posA){
            line = txt.substring(posA,posB).trim();

            switch(line.charAt(0)){
                case "o":
                    itm = line.split(" ");
                    if(fIndex.length>0){
                        objects[currentObjName]=[fIndex,fVert,fNorm,fUV];
                        aCache = [];
                        cVert = [];
                        cNorm = [];
                        cUV = [];
                        fVert = [];
                        fNorm = [];
                        fUV = [];
                        fIndex = [];
                        currentObjName = itm[1];
                    }
                    else{
                        currentObjName = itm[1];
                        objects[currentObjName]=undefined;
                    }
                    break;
                case "v":
                    itm = line.split(" "); itm.shift();
                    switch(line.charAt(1)){
                        case " ": cVert.push(parseFloat(itm[0]),parseFloat(itm[1]),parseFloat(itm[2]));break;
                        case "t": cUV.push(parseFloat(itm[0]),parseFloat(itm[1]));break;
                        case "n": cNorm.push(parseFloat(itm[0]),parseFloat(itm[1]),parseFloat(itm[2]));break;
                    }
                    break;
                case "f":
                    itm = line.split(" "); itm.shift();
                    isQuad = false;

                    for(i=0;i<itm.length;i++){
                        //如果这个面是四边形，而不是三角形
                        if(i===3 && !isQuad){
                            i=2;//如果是四边形，上一个三角形的最后一个顶点，是第二个三角形的起始顶点
                            isQuad=true;
                        }
                        if(itm[i] in aCache){
                            fIndex.push(aCache[itm[i]]);
                        }
                        else{
                            ary = itm[i].split("/");

                            ind = (parseInt(ary[0])-1)*3;
                            fVert.push(cVert[ind],cVert[ind+1],cVert[ind+2]);

                            ind = (parseInt(ary[2])-1)*3;
                            fNorm.push(cNorm[ind],cNorm[ind+1],cNorm[ind+2]);

                            if(ary[1]!==""){
                                ind = (parseInt(ary[1])-1)*2;
                                fUV.push(cUV[ind],(flipYUV?1-cUV[ind+1]:cUV[ind+1]));
                            }

                            aCache[itm[i]] = fIndexCnt;
                            fIndex.push(fIndexCnt);
                            fIndexCnt++;
                        }

                        if(i===3 && isQuad){
                            fIndex.push(aCache[itm[0]]);
                        }
                    }
                    break;
            }
            posA = posB+1;
            posB = txt.indexOf("\n",posA);
        }
        objects[currentObjName]=[fIndex,fVert,fNorm,fUV];

        return objects;
    }
}