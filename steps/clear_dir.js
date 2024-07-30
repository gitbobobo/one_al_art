import fse from 'fs-extra';
import config from '../config.js'


/// 整理完目录后，Windows系统可能会出现文件夹无法删除的情况，此功能用于清空输出目录
/// 请确保输出目录的文件已安全转移

const emptyDir = () => {
    fse.emptyDir(config.outputPath)
  .then(() => {
    console.log('目录已清空');
  })
  .catch(err => {
    console.error(err);
  });
}

emptyDir()