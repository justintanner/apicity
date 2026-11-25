# Changelog

## [Unreleased]

### Added

- Add SkyReels V4 reference-to-video at `api.v3.skyworkAi.skyreelsV4.referenceToVideo`. It accepts a prompt, up to three reference images and one reference video, and generates 3–15 seconds at 480p, 720p, or 1080p (ac-wk1wse).
- Add Seedance 2.5 Flash reference-to-video at `api.v3.bytedance.seedance2p5Flash.referenceToVideo`, a leaf on `bytedance.seedance2p5Flash`. It takes a prompt with up to 10 reference images, 5 reference videos and 5 reference audio clips, six aspect ratios, 4-30 s, 480p to 4k, optional audio, and `mp4` or `mov` output (ac-ifaxto).
- Add Seedance 2.5 Flash image-to-video at `api.v3.bytedance.seedance2p5Flash.imageToVideo`, owning `bytedance.seedance2p5Flash`. It takes a start image, an optional last frame, 4-30 s, 480p to 4k, optional audio, and `mp4` or `mov` output (ac-nrpv6b).
- Add MAI-Image-2.7-Flash edit at `api.v3.microsoft.maiImage2p7Flash.edit`. It accepts a prompt (up to 20,000 characters) and 1-5 input images (ac-3ql6fp).
- Add MAI-Image-2.7 text-to-image at `api.v3.microsoft.maiImage2p7.textToImage`. It accepts a prompt, 11 aspect ratios, and 1k or 2k resolution (ac-8f0kj2).
