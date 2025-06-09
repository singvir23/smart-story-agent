let _currFile;

const FileHandler = () => {
  const fnames = [
    'newsStory.json'
  ];

  async function file(filename) {
    try {
      const res = await fetch(`/assets/narratives/${filename}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!data || !data.scenes) {
        console.error("Malformed or incomplete data:", data);
        return null;
      }
      _currFile = filename;
      data.filename = filename;
      return data;
    } catch (err) {
      console.error("Failed to load JSON file:", err);
      return null;
    }
  }


  function filenames() {
    return fnames;
  }

  function currFile() {
    return _currFile;
  }

  return {
    file,
    filenames,
    currFile,
  };
};

export default FileHandler;
