      var ymlStr
      var filepath
      var funcIds
      try {
        filepath = `${process.env.ROOT_PATH}/${adminId}/${projectId}/hmi/funcIds.yml`
        ymlStr = fs.readFileSync(filepath)
        funcIds = YAML.safeLoad(ymlStr)
        for (var id in funcIds) {
          funcIds[id].typeId = id
        }

      } catch(err) {
        msg(0,f,ERROR,err,filepath);
      }
