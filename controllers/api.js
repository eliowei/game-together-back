export const upload = (req, res) => {
  res.json({ url: req.file.path })
}
