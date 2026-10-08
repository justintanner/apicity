export interface ApicitySchemaIssue {
  path: readonly PropertyKey[];
  message: string;
  code?: string;
}

export interface ApicitySchemaError {
  issues: readonly ApicitySchemaIssue[];
}

export type ApicitySafeParseResult<T> =
  | { success: true; data: T }
  | { success: false; error: ApicitySchemaError };

export interface ApicitySchema<T = unknown> {
  parse(data: unknown): T;
  safeParse(data: unknown): ApicitySafeParseResult<T>;
  description?: string;
}

// ---------------------------------------------------------------------------
// Request types — derived from Zod schemas (source of truth in zod.ts)
// ---------------------------------------------------------------------------

export type {
  FalLumaAgentRayV3p2VideoToVideoParsedRequest,
  FalLumaAgentRayV3p2VideoToVideoRequestInput,
  FalLumaAgentRayV3p2VideoToVideoRequest,
  FalLumaAgentRayV3p2ReframeParsedRequest,
  FalLumaAgentRayV3p2ReframeRequestInput,
  FalLumaAgentRayV3p2ReframeRequest,
  FalNvidiaCosmos3SuperTextToImageParsedRequest,
  FalNvidiaCosmos3SuperTextToImageRequestInput,
  FalNvidiaCosmos3SuperTextToImageRequest,
  FalNvidiaCosmos3SuperImageToVideoParsedRequest,
  FalNvidiaCosmos3SuperImageToVideoRequestInput,
  FalNvidiaCosmos3SuperImageToVideoRequest,
  FalMicrosoftMaiImage2p5ProEditParsedRequest,
  FalMicrosoftMaiImage2p5ProEditRequestInput,
  FalMicrosoftMaiImage2p5ProEditRequest,
  FalMicrosoftMaiImage2p5ProParsedRequest,
  FalMicrosoftMaiImage2p5ProRequestInput,
  FalMicrosoftMaiImage2p5ProRequest,
  FalOpenaiGptImage2p5FlareTextToImageParsedRequest,
  FalOpenaiGptImage2p5FlareTextToImageRequestInput,
  FalOpenaiGptImage2p5FlareTextToImageRequest,
  FalOpenaiGptImage2p5FlareEditParsedRequest,
  FalOpenaiGptImage2p5FlareEditRequestInput,
  FalOpenaiGptImage2p5FlareEditRequest,
  FalOpenaiGptImage2p5SunburstTextToImageParsedRequest,
  FalOpenaiGptImage2p5SunburstTextToImageRequestInput,
  FalOpenaiGptImage2p5SunburstTextToImageRequest,
  FalOpenaiGptImage2p5SunburstEditParsedRequest,
  FalOpenaiGptImage2p5SunburstEditRequestInput,
  FalOpenaiGptImage2p5SunburstEditRequest,
  FalMetaMuseImageEditParsedRequest,
  FalMetaMuseImageEditRequestInput,
  FalMetaMuseImageEditRequest,
  FalMetaMuseImageTextToImageParsedRequest,
  FalMetaMuseImageTextToImageRequestInput,
  FalMetaMuseImageTextToImageRequest,
  FalElevenlabsMusicV2p5ParsedRequest,
  FalElevenlabsMusicV2p5RequestInput,
  FalElevenlabsMusicV2p5Request,
  FalBriaFiboGen1p5TextToImageParsedRequest,
  FalBriaFiboGen1p5TextToImageRequestInput,
  FalBriaFiboGen1p5TextToImageRequest,
  FalBriaFiboEdit1p5EditParsedRequest,
  FalBriaFiboEdit1p5EditRequestInput,
  FalBriaFiboEdit1p5EditRequest,
  FalBlackforestlabsFlux3EditVideoParsedRequest,
  FalBlackforestlabsFlux3EditVideoRequestInput,
  FalBlackforestlabsFlux3EditVideoRequest,
  FalAlibabaHappyHorseV1p1TextToVideoParsedRequest,
  FalAlibabaHappyHorseV1p1TextToVideoRequestInput,
  FalAlibabaHappyHorseV1p1TextToVideoRequest,
  FalAlibabaHappyHorseV1p1ImageToVideoParsedRequest,
  FalAlibabaHappyHorseV1p1ImageToVideoRequestInput,
  FalAlibabaHappyHorseV1p1ImageToVideoRequest,
  FalAlibabaHappyHorseV1p1ReferenceToVideoParsedRequest,
  FalAlibabaHappyHorseV1p1ReferenceToVideoRequestInput,
  FalAlibabaHappyHorseV1p1ReferenceToVideoRequest,
  FalAlibabaQwenAudio3TtsParsedRequest,
  FalAlibabaQwenAudio3TtsRequestInput,
  FalAlibabaQwenAudio3TtsRequest,
  FalKlingVideoV3TurboProImageToVideoParsedRequest,
  FalKlingVideoV3TurboProImageToVideoRequestInput,
  FalKlingVideoV3TurboProImageToVideoRequest,
  FalKlingVideoV3TurboProTextToVideoParsedRequest,
  FalKlingVideoV3TurboProTextToVideoRequestInput,
  FalKlingVideoV3TurboProTextToVideoRequest,
  FalKlingVideoV3TurboStandardImageToVideoParsedRequest,
  FalKlingVideoV3TurboStandardImageToVideoRequestInput,
  FalKlingVideoV3TurboStandardImageToVideoRequest,
  FalKlingVideoV3TurboStandardTextToVideoParsedRequest,
  FalKlingVideoV3TurboStandardTextToVideoRequestInput,
  FalKlingVideoV3TurboStandardTextToVideoRequest,
  FalLightricksLtx2p5AudioToVideoFastParsedRequest,
  FalLightricksLtx2p5AudioToVideoFastRequestInput,
  FalLightricksLtx2p5AudioToVideoFastRequest,
  FalLightricksLtx2p5AudioToVideoProParsedRequest,
  FalLightricksLtx2p5AudioToVideoProRequestInput,
  FalLightricksLtx2p5AudioToVideoProRequest,
  FalLightricksLtx2p5TextToVideoProParsedRequest,
  FalLightricksLtx2p5TextToVideoProRequestInput,
  FalLightricksLtx2p5TextToVideoProRequest,
  FalLightricksLtx2p5TextToVideoFastParsedRequest,
  FalLightricksLtx2p5TextToVideoFastRequestInput,
  FalLightricksLtx2p5TextToVideoFastRequest,
  FalGeminiOmniFlashV1p1TextToVideoParsedRequest,
  FalGeminiOmniFlashV1p1TextToVideoRequestInput,
  FalGeminiOmniFlashV1p1TextToVideoRequest,
  FalGeminiOmniFlashV1p1ImageToVideoParsedRequest,
  FalGeminiOmniFlashV1p1ImageToVideoRequestInput,
  FalGeminiOmniFlashV1p1ImageToVideoRequest,
  FalGeminiOmniFlashV1p1ReferenceToVideoParsedRequest,
  FalGeminiOmniFlashV1p1ReferenceToVideoRequestInput,
  FalGeminiOmniFlashV1p1ReferenceToVideoRequest,
  FalGeminiOmniFlashV1p1EditParsedRequest,
  FalGeminiOmniFlashV1p1EditRequestInput,
  FalGeminiOmniFlashV1p1EditRequest,
  FalXaiGrokImagineVideoV1p5ImageToVideoParsedRequest,
  FalXaiGrokImagineVideoV1p5ImageToVideoRequestInput,
  FalXaiGrokImagineVideoV1p5ImageToVideoRequest,
  FalXaiGrokImagineVideoV1p5TextToVideoParsedRequest,
  FalXaiGrokImagineVideoV1p5TextToVideoRequestInput,
  FalXaiGrokImagineVideoV1p5TextToVideoRequest,
  FalMinimaxH3MaxTurboTextToVideoParsedRequest,
  FalMinimaxH3MaxTurboTextToVideoRequestInput,
  FalMinimaxH3MaxTurboTextToVideoRequest,
  FalMinimaxH3MaxTurboImageToVideoParsedRequest,
  FalMinimaxH3MaxTurboImageToVideoRequestInput,
  FalMinimaxH3MaxTurboImageToVideoRequest,
  FalMinimaxH3MaxLipSyncImageToVideoParsedRequest,
  FalMinimaxH3MaxLipSyncImageToVideoRequestInput,
  FalMinimaxH3MaxLipSyncImageToVideoRequest,
  FalMinimaxH3MaxThreeDToVideoParsedRequest,
  FalMinimaxH3MaxThreeDToVideoRequestInput,
  FalMinimaxH3MaxThreeDToVideoRequest,
  FalMinimaxH3MaxReferenceToVideoParsedRequest,
  FalMinimaxH3MaxReferenceToVideoRequestInput,
  FalMinimaxH3MaxReferenceToVideoRequest,
  FalMinimaxH3MaxCameraControlsParsedRequest,
  FalMinimaxH3MaxCameraControlsRequestInput,
  FalMinimaxH3MaxCameraControlsRequest,
  FalMinimaxH3MaxTextToVideoParsedRequest,
  FalMinimaxH3MaxTextToVideoRequestInput,
  FalMinimaxH3MaxTextToVideoRequest,
  FalMinimaxH3MaxImageToVideoParsedRequest,
  FalMinimaxH3MaxImageToVideoRequestInput,
  FalMinimaxH3MaxImageToVideoRequest,
  FalMinimaxH3MaxExtendVideoParsedRequest,
  FalMinimaxH3MaxExtendVideoRequestInput,
  FalMinimaxH3MaxExtendVideoRequest,
  FalBriaFiboEdit1p5ProductHoldingParsedRequest,
  FalBriaFiboEdit1p5ProductHoldingRequestInput,
  FalBriaFiboEdit1p5ProductHoldingRequest,
  FalBriaFiboEdit1p5VirtualTryOnParsedRequest,
  FalBriaFiboEdit1p5VirtualTryOnRequestInput,
  FalBriaFiboEdit1p5VirtualTryOnRequest,
  FalGoogleLyria3p5ParsedRequest,
  FalGoogleLyria3p5RequestInput,
  FalGoogleLyria3p5Request,
  FalMeshyV7p1MultiImageTo3dParsedRequest,
  FalMeshyV7p1MultiImageTo3dRequestInput,
  FalMeshyV7p1MultiImageTo3dRequest,
  FalMeshyV7p1ImageTo3dParsedRequest,
  FalMeshyV7p1ImageTo3dRequestInput,
  FalMeshyV7p1ImageTo3dRequest,
  FalMeshyV7p1TextTo3dParsedRequest,
  FalMeshyV7p1TextTo3dRequestInput,
  FalMeshyV7p1TextTo3dRequest,
  FalRecraftV4p1FlashTextToImageParsedRequest,
  FalRecraftV4p1FlashTextToImageRequestInput,
  FalRecraftV4p1FlashTextToImageRequest,
  FalTripo3dP2ImageTo3dParsedRequest,
  FalTripo3dP2ImageTo3dRequestInput,
  FalTripo3dP2ImageTo3dRequest,
  FalTripo3dP2TextTo3dParsedRequest,
  FalTripo3dP2TextTo3dRequestInput,
  FalTripo3dP2TextTo3dRequest,
  FalBytedanceSeedreamV5FlashTextToImageParsedRequest,
  FalBytedanceSeedreamV5FlashTextToImageRequestInput,
  FalBytedanceSeedreamV5FlashTextToImageRequest,
  FalBytedanceSeedreamV5FlashEditParsedRequest,
  FalBytedanceSeedreamV5FlashEditRequestInput,
  FalBytedanceSeedreamV5FlashEditRequest,
  FalBytedanceSeedreamV5FlashLayerizeParsedRequest,
  FalBytedanceSeedreamV5FlashLayerizeRequestInput,
  FalBytedanceSeedreamV5FlashLayerizeRequest,
  FalGoogleGemini3p8FlashLiteTtsParsedRequest,
  FalGoogleGemini3p8FlashLiteTtsRequestInput,
  FalGoogleGemini3p8FlashLiteTtsRequest,
  FalGoogleGemini3p8FlashTtsParsedRequest,
  FalGoogleGemini3p8FlashTtsRequestInput,
  FalGoogleGemini3p8FlashTtsRequest,
  FalElevenlabsTtsElevenV4ParsedRequest,
  FalElevenlabsTtsElevenV4RequestInput,
  FalElevenlabsTtsElevenV4Request,
  FalElevenlabsTtsElevenV4TurboParsedRequest,
  FalElevenlabsTtsElevenV4TurboRequestInput,
  FalElevenlabsTtsElevenV4TurboRequest,
  FalMinimaxH3MaxInsertVideoParsedRequest,
  FalMinimaxH3MaxInsertVideoRequestInput,
  FalMinimaxH3MaxInsertVideoRequest,
  FalIdeogramV4p5ParsedRequest,
  FalIdeogramV4p5RequestInput,
  FalIdeogramV4p5Request,
  FalIdeogramV4p5EditRequest,
  FalIdeogramV4p5EditRequestInput,
  FalIdeogramV4p5EditParsedRequest,
  FalXaiGrokImagineVideoV1p5LiteImageToVideoRequest,
  FalXaiGrokImagineVideoV1p5LiteImageToVideoRequestInput,
  FalXaiGrokImagineVideoV1p5LiteImageToVideoParsedRequest,
  FalFlux3TextToImageRequest,
  FalFlux3TextToImageRequestInput,
  FalFlux3TextToImageParsedRequest,
  FalFlux3EditImageRequest,
  FalFlux3EditImageRequestInput,
  FalFlux3EditImageParsedRequest,
  FalMinimaxH3MaxRecastRequest,
  FalMinimaxH3MaxRecastRequestInput,
  FalMinimaxH3MaxRecastParsedRequest,
  FalXaiGrokImagineVideoV1p5LiteTextToVideoRequest,
  FalXaiGrokImagineVideoV1p5LiteTextToVideoRequestInput,
  FalXaiGrokImagineVideoV1p5LiteTextToVideoParsedRequest,
  FalMinimaxH3MaxTurboExtendVideoRequest,
  FalMinimaxH3MaxTurboExtendVideoRequestInput,
  FalMinimaxH3MaxTurboExtendVideoParsedRequest,
  FalOptions,
  FalEstimateRequest,
  FalEstimateRequestInput,
  FalEstimateParsedRequest,
  FalQueueSubmitParams,
  FalLogsStreamParams,
  FalFilesUploadUrlParams,
  FalFilesUploadLocalParams,
  FalDeletePayloadsParams,
  FalSeedance2p0ImageToVideoParams,
  FalSeedance2p0TextToVideoParams,
  FalSeedance2p0FastImageToVideoParams,
  FalSeedance2p0FastTextToVideoParams,
  FalSeedance2p0ReferenceToVideoParams,
  FalSeedance2p0FastReferenceToVideoParams,
  FalSeedance2p5TextToVideoParams,
  FalSeedance2p5ImageToVideoParams,
  FalSeedance2p5ReferenceToVideoParams,
  FalLtx2p5ImageToVideoProParams,
  FalLtx2p5ImageToVideoFastParams,
  FalNanoBananaProTextToImageParams,
  FalNanoBananaProEditParams,
  FalNanoBanana2TextToImageParams,
  FalNanoBanana2EditParams,
  FalNanoBanana2LiteTextToImageParams,
  FalNanoBanana2LiteEditParams,
  FalVirtualTryOnParams,
  FalTopazUpscaleImagePrecisionParams,
  FalTopazUpscaleVideoPrecisionParams,
  FalMeshyV7ImageTo3dParams,
  FalGeminiOmniFlashParams,
  FalGeminiOmniFlashEditParams,
  FalGeminiOmniFlashImageToVideoParams,
  FalGeminiOmniFlashReferenceToVideoParams,
  FalSeedreamV5LiteEditParams,
  FalSeedreamV5LiteTextToImageParams,
  FalSeedreamV5ProLayerizeParams,
  FalMinimaxH3TextToVideoParams,
  FalMinimaxH3ImageToVideoParams,
  FalSeedreamV5ProTextToImageParams,
  FalSeedreamV5ProEditParams,
  FalSeedSpeechTtsV2Params,
  FalMinimaxMusic3Params,
  FalElevenlabsSpeechToTextScribeV2Params,
  FalAlibabaQwenImage3TextToImageParams,
  FalAlibabaQwenImage3EditParams,
  FalWan3p0TextToVideoParams,
  FalWan3p0ImageToVideoParams,
  FalWan3p0ReferenceToVideoParams,
  FalMinimaxH3ReferenceToVideoParams,
  FalWanV2p7TextToImageParams,
  FalWanV2p7EditParams,
  FalWanV2p7TextToVideoParams,
  FalWanV2p7ImageToVideoParams,
  FalWanV2p7ReferenceToVideoParams,
  FalWanV2p7EditVideoParams,
  FalFlux3TextToVideoParams,
  FalFlux3ImageToVideoParams,
  FalFlux3FirstLastFrameToVideoParams,
  FalFlux3KeyframesToVideoParams,
  FalFlux3ExtendVideoParams,
  FalFluxVideoUpscaleParams,
  FalXaiGrokImagineImageParams,
  FalXaiGrokImagineImageV2p0TextToImageParams,
  FalXaiGrokImagineImageV2p0EditParams,
  FalXaiGrokImagineImageEditParams,
  FalQwenImageParams,
  FalQwenImageEditParams,
  FalGptImage1p5Params,
  FalGptImage1p5EditParams,
  FalNanoBananaTextToImageParams,
  FalNanoBananaEditParams,
  FalXaiGrokImagineVideoImageToVideoParams,
  FalXaiGrokImagineVideoReferenceToVideoParams,
  FalXaiGrokImagineVideoV1p5ReferenceToVideoParams,
  FalXaiGrokImagineVideoExtendVideoParams,
  FalXaiGrokImagineVideoEditVideoParams,
  FalVeo3p1TextToVideoParams,
  FalVeo3p1ImageToVideoParams,
  FalStorageUploadInitiateParams,
  FalStorageUploadInitiateMultipartParams,
  FalStorageUploadCompleteMultipartParams,
  FalKlingVideoV3ProImageToVideoParams,
  FalKlingVideoV3ProTextToVideoParams,
  FalKlingVideoV3StandardImageToVideoParams,
  FalKlingVideoV3StandardTextToVideoParams,
  FalKlingVideoO3p4kImageToVideoParams,
  FalKlingVideoO3p4kReferenceToVideoParams,
  FalKlingVideoO3p4kTextToVideoParams,
  FalSora2TextToVideoParams,
  FalSora2ImageToVideoParams,
  FalHunyuanImageV3InstructEditParams,
  FalSeedance2p0ImageToVideoRequest,
  FalSeedance2p0ImageToVideoRequestInput,
  FalSeedance2p0ImageToVideoParsedRequest,
  FalSeedance2p0TextToVideoRequest,
  FalSeedance2p0TextToVideoRequestInput,
  FalSeedance2p0TextToVideoParsedRequest,
  FalSeedance2p0FastImageToVideoRequest,
  FalSeedance2p0FastImageToVideoRequestInput,
  FalSeedance2p0FastImageToVideoParsedRequest,
  FalSeedance2p0FastTextToVideoRequest,
  FalSeedance2p0FastTextToVideoRequestInput,
  FalSeedance2p0FastTextToVideoParsedRequest,
  FalSeedance2p0ReferenceToVideoRequest,
  FalSeedance2p0ReferenceToVideoRequestInput,
  FalSeedance2p0ReferenceToVideoParsedRequest,
  FalSeedance2p0FastReferenceToVideoRequest,
  FalSeedance2p0FastReferenceToVideoRequestInput,
  FalSeedance2p0FastReferenceToVideoParsedRequest,
  FalSeedance2p5TextToVideoRequest,
  FalSeedance2p5TextToVideoRequestInput,
  FalSeedance2p5TextToVideoParsedRequest,
  FalSeedance2p5ImageToVideoRequest,
  FalSeedance2p5ImageToVideoRequestInput,
  FalSeedance2p5ImageToVideoParsedRequest,
  FalSeedance2p5ReferenceToVideoRequest,
  FalSeedance2p5ReferenceToVideoRequestInput,
  FalSeedance2p5ReferenceToVideoParsedRequest,
  FalLtx2p5ImageToVideoProRequest,
  FalLtx2p5ImageToVideoProRequestInput,
  FalLtx2p5ImageToVideoProParsedRequest,
  FalLtx2p5ImageToVideoFastRequest,
  FalLtx2p5ImageToVideoFastRequestInput,
  FalLtx2p5ImageToVideoFastParsedRequest,
  FalNanoBananaProEditRequest,
  FalNanoBananaProEditRequestInput,
  FalNanoBananaProEditParsedRequest,
  FalNanoBananaProTextToImageRequest,
  FalNanoBananaProTextToImageRequestInput,
  FalNanoBananaProTextToImageParsedRequest,
  FalNanoBananaTextToImageRequest,
  FalNanoBananaTextToImageRequestInput,
  FalNanoBananaTextToImageParsedRequest,
  FalNanoBananaEditRequest,
  FalNanoBananaEditRequestInput,
  FalNanoBananaEditParsedRequest,
  FalNanoBanana2TextToImageRequest,
  FalNanoBanana2TextToImageRequestInput,
  FalNanoBanana2TextToImageParsedRequest,
  FalNanoBanana2EditRequest,
  FalNanoBanana2EditRequestInput,
  FalNanoBanana2EditParsedRequest,
  FalNanoBanana2LiteTextToImageRequest,
  FalNanoBanana2LiteTextToImageRequestInput,
  FalNanoBanana2LiteTextToImageParsedRequest,
  FalNanoBanana2LiteEditRequest,
  FalNanoBanana2LiteEditRequestInput,
  FalNanoBanana2LiteEditParsedRequest,
  FalVirtualTryOnRequest,
  FalVirtualTryOnRequestInput,
  FalVirtualTryOnParsedRequest,
  FalTopazUpscaleImagePrecisionRequest,
  FalTopazUpscaleImagePrecisionRequestInput,
  FalTopazUpscaleImagePrecisionParsedRequest,
  FalTopazUpscaleVideoPrecisionRequest,
  FalTopazUpscaleVideoPrecisionRequestInput,
  FalTopazUpscaleVideoPrecisionParsedRequest,
  FalMeshyV7ImageTo3dRequest,
  FalMeshyV7ImageTo3dRequestInput,
  FalMeshyV7ImageTo3dParsedRequest,
  FalGeminiOmniFlashRequest,
  FalGeminiOmniFlashRequestInput,
  FalGeminiOmniFlashParsedRequest,
  FalGeminiOmniFlashEditRequest,
  FalGeminiOmniFlashEditRequestInput,
  FalGeminiOmniFlashEditParsedRequest,
  FalGeminiOmniFlashImageToVideoRequest,
  FalGeminiOmniFlashImageToVideoRequestInput,
  FalGeminiOmniFlashImageToVideoParsedRequest,
  FalGeminiOmniFlashReferenceToVideoRequest,
  FalGeminiOmniFlashReferenceToVideoRequestInput,
  FalGeminiOmniFlashReferenceToVideoParsedRequest,
  FalSeedreamV5LiteEditRequest,
  FalSeedreamV5LiteEditRequestInput,
  FalSeedreamV5LiteEditParsedRequest,
  FalSeedreamV5LiteTextToImageRequest,
  FalSeedreamV5LiteTextToImageRequestInput,
  FalSeedreamV5LiteTextToImageParsedRequest,
  FalSeedreamV5ProLayerizeRequest,
  FalSeedreamV5ProLayerizeRequestInput,
  FalSeedreamV5ProLayerizeParsedRequest,
  FalMinimaxH3TextToVideoRequest,
  FalMinimaxH3TextToVideoRequestInput,
  FalMinimaxH3TextToVideoParsedRequest,
  FalMinimaxH3ImageToVideoRequest,
  FalMinimaxH3ImageToVideoRequestInput,
  FalMinimaxH3ImageToVideoParsedRequest,
  FalSeedreamV5ProTextToImageRequest,
  FalSeedreamV5ProTextToImageRequestInput,
  FalSeedreamV5ProTextToImageParsedRequest,
  FalSeedreamV5ProEditRequest,
  FalSeedreamV5ProEditRequestInput,
  FalSeedreamV5ProEditParsedRequest,
  FalSeedSpeechTtsV2Request,
  FalSeedSpeechTtsV2RequestInput,
  FalSeedSpeechTtsV2ParsedRequest,
  FalMinimaxMusic3Request,
  FalMinimaxMusic3RequestInput,
  FalMinimaxMusic3ParsedRequest,
  FalElevenlabsSpeechToTextScribeV2Request,
  FalElevenlabsSpeechToTextScribeV2RequestInput,
  FalElevenlabsSpeechToTextScribeV2ParsedRequest,
  FalAlibabaQwenImage3TextToImageRequest,
  FalAlibabaQwenImage3TextToImageRequestInput,
  FalAlibabaQwenImage3TextToImageParsedRequest,
  FalAlibabaQwenImage3EditRequest,
  FalAlibabaQwenImage3EditRequestInput,
  FalAlibabaQwenImage3EditParsedRequest,
  FalWan3p0TextToVideoRequest,
  FalWan3p0TextToVideoRequestInput,
  FalWan3p0TextToVideoParsedRequest,
  FalWan3p0ImageToVideoRequest,
  FalWan3p0ImageToVideoRequestInput,
  FalWan3p0ImageToVideoParsedRequest,
  FalWan3p0ReferenceToVideoRequest,
  FalWan3p0ReferenceToVideoRequestInput,
  FalWan3p0ReferenceToVideoParsedRequest,
  FalMinimaxH3ReferenceToVideoRequest,
  FalMinimaxH3ReferenceToVideoRequestInput,
  FalMinimaxH3ReferenceToVideoParsedRequest,
  FalWanV2p7TextToImageRequest,
  FalWanV2p7TextToImageRequestInput,
  FalWanV2p7TextToImageParsedRequest,
  FalWanV2p7EditRequest,
  FalWanV2p7EditRequestInput,
  FalWanV2p7EditParsedRequest,
  FalWanV2p7TextToVideoRequest,
  FalWanV2p7TextToVideoRequestInput,
  FalWanV2p7TextToVideoParsedRequest,
  FalWanV2p7ImageToVideoRequest,
  FalWanV2p7ImageToVideoRequestInput,
  FalWanV2p7ImageToVideoParsedRequest,
  FalWanV2p7ReferenceToVideoRequest,
  FalWanV2p7ReferenceToVideoRequestInput,
  FalWanV2p7ReferenceToVideoParsedRequest,
  FalWanV2p7EditVideoRequest,
  FalWanV2p7EditVideoRequestInput,
  FalWanV2p7EditVideoParsedRequest,
  FalFlux3TextToVideoRequest,
  FalFlux3TextToVideoRequestInput,
  FalFlux3TextToVideoParsedRequest,
  FalFlux3ImageToVideoRequest,
  FalFlux3ImageToVideoRequestInput,
  FalFlux3ImageToVideoParsedRequest,
  FalFlux3FirstLastFrameToVideoRequest,
  FalFlux3FirstLastFrameToVideoRequestInput,
  FalFlux3FirstLastFrameToVideoParsedRequest,
  FalFlux3KeyframesToVideoRequest,
  FalFlux3KeyframesToVideoRequestInput,
  FalFlux3KeyframesToVideoParsedRequest,
  FalFlux3ExtendVideoRequest,
  FalFlux3ExtendVideoRequestInput,
  FalFlux3ExtendVideoParsedRequest,
  FalFluxVideoUpscaleRequest,
  FalFluxVideoUpscaleRequestInput,
  FalFluxVideoUpscaleParsedRequest,
  FalXaiGrokImagineImageEditRequest,
  FalXaiGrokImagineImageEditRequestInput,
  FalXaiGrokImagineImageEditParsedRequest,
  FalSora2TextToVideoRequest,
  FalSora2TextToVideoRequestInput,
  FalSora2TextToVideoParsedRequest,
  FalSora2ImageToVideoRequest,
  FalSora2ImageToVideoRequestInput,
  FalSora2ImageToVideoParsedRequest,
  FalHunyuanImageV3InstructEditRequest,
  FalHunyuanImageV3InstructEditRequestInput,
  FalHunyuanImageV3InstructEditParsedRequest,
  FalKlingVideoV3ProImageToVideoRequest,
  FalKlingVideoV3ProImageToVideoRequestInput,
  FalKlingVideoV3ProImageToVideoParsedRequest,
  FalKlingVideoV3ProTextToVideoRequest,
  FalKlingVideoV3ProTextToVideoRequestInput,
  FalKlingVideoV3ProTextToVideoParsedRequest,
  FalKlingVideoV3StandardImageToVideoRequest,
  FalKlingVideoV3StandardImageToVideoRequestInput,
  FalKlingVideoV3StandardImageToVideoParsedRequest,
  FalKlingVideoV3StandardTextToVideoRequest,
  FalKlingVideoV3StandardTextToVideoRequestInput,
  FalKlingVideoV3StandardTextToVideoParsedRequest,
  FalKlingVideoO3p4kImageToVideoRequest,
  FalKlingVideoO3p4kImageToVideoRequestInput,
  FalKlingVideoO3p4kImageToVideoParsedRequest,
  FalKlingVideoO3p4kReferenceToVideoRequest,
  FalKlingVideoO3p4kReferenceToVideoRequestInput,
  FalKlingVideoO3p4kReferenceToVideoParsedRequest,
  FalKlingVideoO3p4kTextToVideoRequest,
  FalKlingVideoO3p4kTextToVideoRequestInput,
  FalKlingVideoO3p4kTextToVideoParsedRequest,
  FalVeo3p1TextToVideoRequest,
  FalVeo3p1TextToVideoRequestInput,
  FalVeo3p1TextToVideoParsedRequest,
  FalVeo3p1ImageToVideoRequest,
  FalVeo3p1ImageToVideoRequestInput,
  FalVeo3p1ImageToVideoParsedRequest,
  FalXaiGrokImagineVideoImageToVideoRequest,
  FalXaiGrokImagineVideoImageToVideoRequestInput,
  FalXaiGrokImagineVideoImageToVideoParsedRequest,
  FalXaiGrokImagineVideoReferenceToVideoRequest,
  FalXaiGrokImagineVideoReferenceToVideoRequestInput,
  FalXaiGrokImagineVideoReferenceToVideoParsedRequest,
  FalXaiGrokImagineVideoV1p5ReferenceToVideoRequest,
  FalXaiGrokImagineVideoV1p5ReferenceToVideoRequestInput,
  FalXaiGrokImagineVideoV1p5ReferenceToVideoParsedRequest,
  FalXaiGrokImagineVideoExtendVideoRequest,
  FalXaiGrokImagineVideoExtendVideoRequestInput,
  FalXaiGrokImagineVideoExtendVideoParsedRequest,
  FalXaiGrokImagineVideoEditVideoRequest,
  FalXaiGrokImagineVideoEditVideoRequestInput,
  FalXaiGrokImagineVideoEditVideoParsedRequest,
  FalXaiGrokImagineImageRequest,
  FalXaiGrokImagineImageRequestInput,
  FalXaiGrokImagineImageParsedRequest,
  FalXaiGrokImagineImageV2p0TextToImageRequest,
  FalXaiGrokImagineImageV2p0TextToImageRequestInput,
  FalXaiGrokImagineImageV2p0TextToImageParsedRequest,
  FalXaiGrokImagineImageV2p0EditRequest,
  FalXaiGrokImagineImageV2p0EditRequestInput,
  FalXaiGrokImagineImageV2p0EditParsedRequest,
  FalQwenImageEditRequest,
  FalQwenImageEditRequestInput,
  FalQwenImageEditParsedRequest,
  FalGptImage1p5EditRequest,
  FalGptImage1p5EditRequestInput,
  FalGptImage1p5EditParsedRequest,
  FalGptImage1p5Request,
  FalGptImage1p5RequestInput,
  FalGptImage1p5ParsedRequest,
  FalQwenImageRequest,
  FalQwenImageRequestInput,
  FalQwenImageParsedRequest,
  FalEndpointId,
  FalEndpointInputMap,
  FalQueueSubmitRequest,
} from "./zod";

// Re-import for use in this file's interface definitions
import type {
  FalLumaAgentRayV3p2VideoToVideoRequest,
  FalLumaAgentRayV3p2ReframeRequest,
  FalNvidiaCosmos3SuperTextToImageRequest,
  FalNvidiaCosmos3SuperImageToVideoRequest,
  FalMicrosoftMaiImage2p5ProEditRequest,
  FalMicrosoftMaiImage2p5ProRequest,
  FalOpenaiGptImage2p5FlareTextToImageRequest,
  FalOpenaiGptImage2p5FlareEditRequest,
  FalOpenaiGptImage2p5SunburstTextToImageRequest,
  FalOpenaiGptImage2p5SunburstEditRequest,
  FalMetaMuseImageEditRequest,
  FalMetaMuseImageTextToImageRequest,
  FalElevenlabsMusicV2p5Request,
  FalBriaFiboGen1p5TextToImageRequest,
  FalBriaFiboEdit1p5EditRequest,
  FalBlackforestlabsFlux3EditVideoRequest,
  FalAlibabaHappyHorseV1p1TextToVideoRequest,
  FalAlibabaHappyHorseV1p1ImageToVideoRequest,
  FalAlibabaHappyHorseV1p1ReferenceToVideoRequest,
  FalAlibabaQwenAudio3TtsRequest,
  FalKlingVideoV3TurboProImageToVideoRequest,
  FalKlingVideoV3TurboProTextToVideoRequest,
  FalKlingVideoV3TurboStandardImageToVideoRequest,
  FalKlingVideoV3TurboStandardTextToVideoRequest,
  FalLightricksLtx2p5AudioToVideoFastRequest,
  FalLightricksLtx2p5AudioToVideoProRequest,
  FalLightricksLtx2p5TextToVideoProRequest,
  FalLightricksLtx2p5TextToVideoFastRequest,
  FalGeminiOmniFlashV1p1TextToVideoRequest,
  FalGeminiOmniFlashV1p1ImageToVideoRequest,
  FalGeminiOmniFlashV1p1ReferenceToVideoRequest,
  FalGeminiOmniFlashV1p1EditRequest,
  FalXaiGrokImagineVideoV1p5ImageToVideoRequest,
  FalXaiGrokImagineVideoV1p5TextToVideoRequest,
  FalMinimaxH3MaxTurboTextToVideoRequest,
  FalMinimaxH3MaxTurboImageToVideoRequest,
  FalMinimaxH3MaxLipSyncImageToVideoRequest,
  FalMinimaxH3MaxThreeDToVideoRequest,
  FalMinimaxH3MaxReferenceToVideoRequest,
  FalMinimaxH3MaxCameraControlsRequest,
  FalMinimaxH3MaxTextToVideoRequest,
  FalMinimaxH3MaxImageToVideoRequest,
  FalMinimaxH3MaxExtendVideoRequest,
  FalBriaFiboEdit1p5ProductHoldingRequest,
  FalBriaFiboEdit1p5VirtualTryOnRequest,
  FalGoogleLyria3p5Request,
  FalMeshyV7p1MultiImageTo3dRequest,
  FalMeshyV7p1ImageTo3dRequest,
  FalMeshyV7p1TextTo3dRequest,
  FalRecraftV4p1FlashTextToImageRequest,
  FalTripo3dP2ImageTo3dRequest,
  FalTripo3dP2TextTo3dRequest,
  FalBytedanceSeedreamV5FlashTextToImageRequest,
  FalBytedanceSeedreamV5FlashEditRequest,
  FalBytedanceSeedreamV5FlashLayerizeRequest,
  FalGoogleGemini3p8FlashLiteTtsRequest,
  FalGoogleGemini3p8FlashTtsRequest,
  FalElevenlabsTtsElevenV4Request,
  FalElevenlabsTtsElevenV4TurboRequest,
  FalMinimaxH3MaxInsertVideoRequest,
  FalIdeogramV4p5Request,
  FalIdeogramV4p5EditRequest,
  FalXaiGrokImagineVideoV1p5LiteImageToVideoRequest,
  FalFlux3TextToImageRequest,
  FalFlux3EditImageRequest,
  FalMinimaxH3MaxRecastRequest,
  FalXaiGrokImagineVideoV1p5LiteTextToVideoRequest,
  FalMinimaxH3MaxTurboExtendVideoRequest,
  FalEstimateRequest,
  FalQueueSubmitParams,
  FalQueueSubmitRequest,
  FalLogsStreamParams,
  FalFilesUploadUrlParams,
  FalFilesUploadLocalParams,
  FalDeletePayloadsParams,
  FalStorageUploadInitiateParams,
  FalStorageUploadInitiateMultipartParams,
  FalStorageUploadCompleteMultipartParams,
  FalSeedreamV5LiteTextToImageParams,
  FalSeedance2p0ImageToVideoRequest,
  FalSeedance2p0TextToVideoRequest,
  FalSeedance2p0FastImageToVideoRequest,
  FalSeedance2p0FastTextToVideoRequest,
  FalSeedance2p0ReferenceToVideoRequest,
  FalSeedance2p0FastReferenceToVideoRequest,
  FalSeedance2p5TextToVideoRequest,
  FalSeedance2p5ImageToVideoRequest,
  FalSeedance2p5ReferenceToVideoRequest,
  FalLtx2p5ImageToVideoProRequest,
  FalLtx2p5ImageToVideoFastRequest,
  FalNanoBananaProEditRequest,
  FalNanoBananaProTextToImageRequest,
  FalNanoBananaTextToImageRequest,
  FalNanoBananaEditRequest,
  FalNanoBanana2TextToImageRequest,
  FalNanoBanana2EditRequest,
  FalNanoBanana2LiteTextToImageRequest,
  FalNanoBanana2LiteEditRequest,
  FalVirtualTryOnRequest,
  FalTopazUpscaleImagePrecisionRequest,
  FalTopazUpscaleVideoPrecisionRequest,
  FalMeshyV7ImageTo3dRequest,
  FalGeminiOmniFlashRequest,
  FalGeminiOmniFlashEditRequest,
  FalGeminiOmniFlashImageToVideoRequest,
  FalGeminiOmniFlashReferenceToVideoRequest,
  FalSeedreamV5LiteEditRequest,
  FalSeedreamV5LiteTextToImageRequest,
  FalSeedreamV5ProLayerizeRequest,
  FalMinimaxH3TextToVideoRequest,
  FalMinimaxH3ImageToVideoRequest,
  FalSeedreamV5ProTextToImageRequest,
  FalSeedreamV5ProEditRequest,
  FalSeedSpeechTtsV2Request,
  FalMinimaxMusic3Request,
  FalElevenlabsSpeechToTextScribeV2Request,
  FalAlibabaQwenImage3TextToImageRequest,
  FalAlibabaQwenImage3EditRequest,
  FalWan3p0TextToVideoRequest,
  FalWan3p0ImageToVideoRequest,
  FalWan3p0ReferenceToVideoRequest,
  FalMinimaxH3ReferenceToVideoRequest,
  FalWanV2p7TextToImageRequest,
  FalWanV2p7EditRequest,
  FalWanV2p7TextToVideoRequest,
  FalWanV2p7ImageToVideoRequest,
  FalWanV2p7ReferenceToVideoRequest,
  FalWanV2p7EditVideoRequest,
  FalFlux3TextToVideoRequest,
  FalFlux3ImageToVideoRequest,
  FalFlux3FirstLastFrameToVideoRequest,
  FalFlux3KeyframesToVideoRequest,
  FalFlux3ExtendVideoRequest,
  FalFluxVideoUpscaleRequest,
  FalXaiGrokImagineImageEditRequest,
  FalSora2TextToVideoRequest,
  FalSora2ImageToVideoRequest,
  FalHunyuanImageV3InstructEditRequest,
  FalKlingVideoV3ProImageToVideoRequest,
  FalKlingVideoV3ProTextToVideoRequest,
  FalKlingVideoV3StandardImageToVideoRequest,
  FalKlingVideoV3StandardTextToVideoRequest,
  FalKlingVideoO3p4kImageToVideoRequest,
  FalKlingVideoO3p4kReferenceToVideoRequest,
  FalKlingVideoO3p4kTextToVideoRequest,
  FalVeo3p1TextToVideoRequest,
  FalVeo3p1ImageToVideoRequest,
  FalXaiGrokImagineVideoImageToVideoRequest,
  FalXaiGrokImagineVideoReferenceToVideoRequest,
  FalXaiGrokImagineVideoV1p5ReferenceToVideoRequest,
  FalXaiGrokImagineVideoExtendVideoRequest,
  FalXaiGrokImagineVideoEditVideoRequest,
  FalXaiGrokImagineImageRequest,
  FalXaiGrokImagineImageV2p0TextToImageRequest,
  FalXaiGrokImagineImageV2p0EditRequest,
  FalQwenImageEditRequest,
  FalGptImage1p5EditRequest,
  FalGptImage1p5Request,
  FalQwenImageRequest,
} from "./zod";

// Error types returned by fal API
export type FalErrorType =
  | "authorization_error"
  | "validation_error"
  | "not_found"
  | "rate_limited"
  | "server_error"
  | "not_implemented";

// Error class
export class FalError extends Error {
  readonly status: number;
  readonly type: FalErrorType;
  readonly request_id?: string;
  readonly docs_url?: string;
  readonly body: unknown;

  constructor(
    message: string,
    status: number,
    type: FalErrorType,
    request_id?: string,
    docs_url?: string,
    body?: unknown
  ) {
    super(message);
    this.name = "FalError";
    this.status = status;
    this.type = type;
    this.request_id = request_id;
    this.docs_url = docs_url;
    this.body = body ?? null;
  }
}

// Pagination parameters
export interface FalPaginatedParams {
  limit?: number;
  cursor?: string;
}

// Time range parameters
export interface FalTimeRangeParams {
  start?: string;
  end?: string;
  timezone?: string;
  timeframe?: "minute" | "hour" | "day" | "week" | "month";
  bound_to_timeframe?: boolean;
}

// ==================== Models ====================

// Model search parameters
export interface FalModelSearchParams extends FalPaginatedParams {
  endpoint_id?: string | string[];
  q?: string;
  category?: string;
  status?: "active" | "deprecated";
  expand?: string[];
}

// Model group information
export interface FalModelGroup {
  key: string;
  label: string;
}

// Model metadata
export interface FalModelMetadata {
  display_name: string;
  category: string;
  description: string;
  status: "active" | "deprecated";
  tags: string[];
  updated_at: string;
  is_favorited: boolean | null;
  thumbnail_url: string;
  thumbnail_animated_url?: string;
  model_url: string;
  github_url?: string;
  license_type?: "commercial" | "research" | "private";
  date: string;
  group?: FalModelGroup;
  highlighted: boolean;
  kind?: "inference" | "training";
  training_endpoint_ids?: string[];
  inference_endpoint_ids?: string[];
  stream_url?: string;
  duration_estimate?: number;
  pinned: boolean;
}

// OpenAPI specification or error
export interface FalOpenApiSpec {
  openapi: string;
  [key: string]: unknown;
}

export interface FalOpenApiError {
  error: {
    code: string;
    message: string;
  };
}

// Model information
export interface FalModel {
  endpoint_id: string;
  metadata?: FalModelMetadata;
  openapi?: FalOpenApiSpec | FalOpenApiError;
}

// Model search response
export interface FalModelSearchResponse {
  models: FalModel[];
  next_cursor: string | null;
  has_more: boolean;
}

// ==================== Pricing ====================

// Pricing parameters
export interface FalPricingParams {
  endpoint_id: string | string[];
}

// Price information for a model
export interface FalPrice {
  endpoint_id: string;
  unit_price: number;
  unit: string;
  currency: string;
}

// Pricing response
export interface FalPricingResponse {
  prices: FalPrice[];
  next_cursor: string | null;
  has_more: boolean;
}

// ==================== Cost Estimation ====================

// Estimate response
export interface FalEstimateResponse {
  estimate_type: "historical_api_price" | "unit_price";
  total_cost: number;
  currency: string;
}

// ==================== Usage ====================

// Usage parameters
export interface FalUsageParams extends FalPaginatedParams, FalTimeRangeParams {
  endpoint_id?: string | string[];
  expand?: string[];
}

// Usage record
export interface FalUsageRecord {
  endpoint_id: string;
  unit: string;
  quantity: number;
  unit_price: number;
  cost: number;
  currency: string;
  auth_method?: string;
}

// Usage time bucket
export interface FalUsageBucket {
  bucket: string;
  results: FalUsageRecord[];
}

// Usage response
export interface FalUsageResponse {
  next_cursor: string | null;
  has_more: boolean;
  time_series?: FalUsageBucket[];
  summary?: FalUsageRecord[];
}

// ==================== Analytics ====================

// Analytics parameters
export interface FalAnalyticsParams
  extends FalPaginatedParams, FalTimeRangeParams {
  endpoint_id: string | string[];
  expand?: string[];
}

// Analytics record
export interface FalAnalyticsRecord {
  endpoint_id: string;
  request_count?: number;
  success_count?: number;
  user_error_count?: number;
  error_count?: number;
  p50_duration?: number;
  p75_duration?: number;
  p90_duration?: number;
  p50_prepare_duration?: number;
  p75_prepare_duration?: number;
  p90_prepare_duration?: number;
}

// Analytics time bucket
export interface FalAnalyticsBucket {
  bucket: string;
  results: FalAnalyticsRecord[];
}

// Analytics response
export interface FalAnalyticsResponse {
  next_cursor: string | null;
  has_more: boolean;
  time_series?: FalAnalyticsBucket[];
  summary?: FalAnalyticsRecord[];
}

// ==================== Requests ====================

// Requests parameters
export interface FalRequestsParams extends FalPaginatedParams {
  endpoint_id: string;
  start?: string;
  end?: string;
  status?: "success" | "error" | "user_error";
  request_id?: string;
  expand?: string[];
  sort_by?: "ended_at" | "duration";
}

// Request item
export interface FalRequestItem {
  request_id: string;
  endpoint_id: string;
  started_at: string;
  sent_at: string;
  ended_at?: string;
  status_code?: number;
  duration?: number;
  json_input?: unknown;
  json_output?: unknown;
}

// Requests response
export interface FalRequestsResponse {
  next_cursor: string | null;
  has_more: boolean;
  items: FalRequestItem[];
}

// ==================== Delete Payloads ====================

// CDN delete result
export interface FalCdnDeleteResult {
  link: string;
  exception: string | null;
}

// Delete payloads response
export interface FalDeletePayloadsResponse {
  cdn_delete_results: FalCdnDeleteResult[];
}

// ==================== Workflows ====================

// Workflow list parameters
export interface FalWorkflowListParams extends FalPaginatedParams {
  search?: string;
  used_endpoint_ids?: string | string[];
}

// Workflow list item
export interface FalWorkflowListItem {
  name: string;
  title: string;
  user_nickname: string;
  created_at: string;
  thumbnail_url?: string;
  description?: string;
  tags: string[];
  endpoint_ids: string[];
}

// Workflow list response
export interface FalWorkflowListResponse {
  workflows: FalWorkflowListItem[];
  next_cursor: string | null;
  has_more: boolean;
  total?: number;
}

// Workflow get parameters
export interface FalWorkflowGetParams {
  username: string;
  workflow_name: string;
}

// Workflow detail
export interface FalWorkflowDetail {
  name: string;
  title: string;
  user_nickname: string;
  created_at: string;
  is_public: boolean;
  contents: Record<string, unknown>;
}

// Workflow get response
export interface FalWorkflowGetResponse {
  workflow: FalWorkflowDetail;
}

// ==================== fal.run inference models ====================

// Generic file output returned by fal.run inference models
export interface FalFile {
  url: string;
  content_type?: string;
  file_name?: string;
  file_size?: number | null;
}

// Video file output — fal video models include media metadata alongside FalFile
export interface FalVideoFile extends FalFile {
  width?: number;
  height?: number;
  fps?: number;
  duration?: number;
  num_frames?: number;
}

// ==================== FLUX 3 (Black Forest Labs) ====================

export type FalFlux3AspectRatio =
  | "auto"
  | "21:9"
  | "2:1"
  | "16:9"
  | "4:3"
  | "1:1"
  | "3:4"
  | "9:16";

export type FalFlux3Resolution = "720p" | "1080p";

export type FalFlux3Duration = "auto" | number;

export interface FalFlux3Keyframe {
  image_url: string;
  frame_index: number;
}

export interface FalFlux3VideoResponse {
  video: FalVideoFile;
  seed: number;
}

export interface FalFluxVideoUpscaleResponse {
  video: FalVideoFile;
}

// ==================== ElevenLabs Speech to Text Scribe V2 ====================

// Transcription word details
export interface FalTranscriptionWord {
  text: string;
  start: number;
  end: number;
  speaker_id: string;
  type: "word" | "spacing" | "audio_event";
}

// ElevenLabs Scribe V2 speech-to-text response
export interface FalElevenlabsSpeechToTextScribeV2Response {
  text: string;
  language_code: string;
  language_probability: number;
  words: FalTranscriptionWord[];
}

// ByteDance Seedance 2.0 image-to-video
export type FalSeedanceResolution = "480p" | "720p";
export type FalSeedanceDuration =
  | "auto"
  | "4"
  | "5"
  | "6"
  | "7"
  | "8"
  | "9"
  | "10"
  | "11"
  | "12"
  | "13"
  | "14"
  | "15";
export type FalSeedanceAspectRatio =
  | "auto"
  | "21:9"
  | "16:9"
  | "4:3"
  | "1:1"
  | "3:4"
  | "9:16";

export interface FalSeedance2p0ImageToVideoResponse {
  video: FalFile;
  seed: number;
}

export interface FalSeedance2p0TextToVideoResponse {
  video: FalFile;
  seed: number;
}

export interface FalSeedance2p0FastImageToVideoResponse {
  video: FalFile;
  seed: number;
}

export interface FalSeedance2p0FastTextToVideoResponse {
  video: FalFile;
  seed: number;
}

export interface FalSeedance2p0ReferenceToVideoResponse {
  video: FalFile;
  seed: number;
}

export interface FalSeedance2p0FastReferenceToVideoResponse {
  video: FalFile;
  seed: number;
}

export interface FalSeedance2p5TextToVideoResponse {
  video: FalFile;
  seed: number;
}

export interface FalSeedance2p5ImageToVideoResponse {
  video: FalFile;
  seed: number;
}

export interface FalSeedance2p5ReferenceToVideoResponse {
  video: FalFile;
  seed: number;
}

// LTX-2.5 image-to-video (Lightricks). Upstream returns the generated clip and
// nothing else — no seed, no echoed prompt — and the file carries the standard
// fal video metadata.
export interface FalLtx2p5ImageToVideoProResponse {
  video: FalVideoFile;
}
export interface FalLtx2p5ImageToVideoFastResponse {
  video: FalVideoFile;
}

// Nano Banana Pro image generation and editing (Google state-of-the-art image model)
export type FalNanoBananaProAspectRatio =
  | "auto"
  | "21:9"
  | "16:9"
  | "3:2"
  | "4:3"
  | "5:4"
  | "1:1"
  | "4:5"
  | "3:4"
  | "2:3"
  | "9:16";

export type FalNanoBananaProOutputFormat = "jpeg" | "png" | "webp";

export type FalNanoBananaProSafetyTolerance = "1" | "2" | "3" | "4" | "5" | "6";

export type FalNanoBananaProResolution = "1K" | "2K" | "4K";

export interface FalNanoBananaProTextToImageResponse {
  images: FalFile[];
  description: string;
}

export interface FalNanoBananaProEditResponse {
  images: FalFile[];
  description: string;
}

// Nano Banana 2 image generation and editing (Google's newer state-of-the-art image model)
export type FalNanoBanana2AspectRatio =
  | "auto"
  | "21:9"
  | "16:9"
  | "3:2"
  | "4:3"
  | "5:4"
  | "1:1"
  | "4:5"
  | "3:4"
  | "2:3"
  | "9:16"
  | "4:1"
  | "1:4"
  | "8:1"
  | "1:8";

export type FalNanoBanana2OutputFormat = "jpeg" | "png" | "webp";

export type FalNanoBanana2SafetyTolerance = "1" | "2" | "3" | "4" | "5" | "6";

export type FalNanoBanana2Resolution = "0.5K" | "1K" | "2K" | "4K";

export type FalNanoBanana2ThinkingLevel = "minimal" | "high";

export interface FalNanoBanana2TextToImageResponse {
  images: FalFile[];
  description: string;
}

export interface FalNanoBanana2EditResponse {
  images: FalFile[];
  description: string;
}

// Nano Banana 2 Lite image generation and editing
export type FalNanoBanana2LiteAspectRatio = FalNanoBanana2AspectRatio;

export type FalNanoBanana2LiteOutputFormat = "jpeg" | "png" | "webp";

export type FalNanoBanana2LiteSafetyTolerance =
  | "1"
  | "2"
  | "3"
  | "4"
  | "5"
  | "6";

export type FalNanoBanana2LiteThinkingLevel = "minimal" | "high";

export interface FalNanoBanana2LiteTextToImageResponse {
  images: FalFile[];
  description: string;
}

export interface FalNanoBanana2LiteEditResponse {
  images: FalFile[];
  description: string;
}

// Google Virtual Try-On image output. fal's ImageFile schema requires only
// `url` and makes every other field nullable, including the `width`/`height`
// that plain FalFile does not carry, so this models the item shape directly.
export interface FalVirtualTryOnImage {
  url: string;
  content_type?: string | null;
  file_name?: string | null;
  file_size?: number | null;
  width?: number | null;
  height?: number | null;
}

export interface FalVirtualTryOnResponse {
  images: FalVirtualTryOnImage[];
}

// Topaz Precision Image Upscale (Gigapixel). Upstream returns a single File
// whose only required member is `url`, which is exactly FalFile's shape.
export interface FalTopazUpscaleImagePrecisionResponse {
  image: FalFile;
}
// Topaz Precision Video Upscale. Upstream returns a single File whose only
// required member is `url`, which is exactly FalFile's shape.
export interface FalTopazUpscaleVideoPrecisionResponse {
  video: FalFile;
}
// Meshy-7 image-to-3D. Every asset upstream returns is fal's standard File
// object, so these reuse FalFile and only describe how the assets are grouped.
export interface FalMeshyV7ModelUrls {
  glb?: FalFile | null;
  fbx?: FalFile | null;
  obj?: FalFile | null;
  usdz?: FalFile | null;
  blend?: FalFile | null;
  stl?: FalFile | null;
}

// One texture set per material. Only `base_color` is always present; the PBR
// maps arrive only when enable_pbr is true.
export interface FalMeshyV7TextureFiles {
  base_color: FalFile;
  metallic?: FalFile | null;
  normal?: FalFile | null;
  roughness?: FalFile | null;
}

// Bundled with the rigging result, so present only when enable_rigging is true.
export interface FalMeshyV7BasicAnimations {
  walking_glb?: FalFile | null;
  walking_fbx?: FalFile | null;
  walking_armature_glb?: FalFile | null;
  running_glb?: FalFile | null;
  running_fbx?: FalFile | null;
  running_armature_glb?: FalFile | null;
}

// Upstream requires only `model_glb` and `model_urls`. The rigging and
// animation assets appear only when the matching request flag is set, and
// `texture_urls` is empty when should_texture is false.
export interface FalMeshyV7ImageTo3dResponse {
  model_glb: FalFile;
  model_urls: FalMeshyV7ModelUrls;
  thumbnail?: FalFile | null;
  texture_urls?: FalMeshyV7TextureFiles[];
  seed?: number | null;
  animation_glb?: FalFile | null;
  animation_fbx?: FalFile | null;
  rigged_character_glb?: FalFile | null;
  rigged_character_fbx?: FalFile | null;
  basic_animations?: FalMeshyV7BasicAnimations | null;
  rig_task_id?: string | null;
}
// Google Gemini Omni Flash text-to-video. Upstream's output schema carries a
// single plain File — url plus the nullable content_type/file_name/file_size —
// and no width/height/fps/duration, so FalFile is the exact shape.
export interface FalGeminiOmniFlashResponse {
  video: FalFile;
}
// Google Gemini Omni Flash video edit. Upstream's output schema carries a
// single plain File — url plus the nullable content_type/file_name/file_size —
// and no width/height/fps/duration, so FalFile is the exact shape.
export interface FalGeminiOmniFlashEditResponse {
  video: FalFile;
}
// Google Gemini Omni Flash image-to-video. Upstream's output schema carries a
// single plain File — url plus the nullable content_type/file_name/file_size —
// and no width/height/fps/duration, so FalFile is the exact shape.
export interface FalGeminiOmniFlashImageToVideoResponse {
  video: FalFile;
}
// Google Gemini Omni Flash reference-to-video. Upstream's output schema
// carries a single plain File — url plus the nullable
// content_type/file_name/file_size — and no width/height/fps/duration, so
// FalFile is the exact shape.
export interface FalGeminiOmniFlashReferenceToVideoResponse {
  video: FalFile;
}

// Qwen Image (text-to-image and edit)
export type FalQwenImageSize =
  | "square_hd"
  | "square"
  | "portrait_4_3"
  | "portrait_16_9"
  | "landscape_4_3"
  | "landscape_16_9"
  | { width: number; height: number };

export type FalQwenImageOutputFormat = "jpeg" | "png";

export type FalQwenImageAcceleration = "none" | "regular" | "high";

export interface FalQwenImageResponse {
  images: FalFile[];
  timings: Record<string, unknown>;
  seed: number;
  has_nsfw_concepts: boolean[];
  prompt: string;
}

export interface FalQwenImageEditResponse {
  images: FalFile[];
  timings: Record<string, unknown>;
  seed: number;
  has_nsfw_concepts: boolean[];
  prompt: string;
}

// GPT Image 1.5 (text-to-image and edit)
export type FalGptImage1p5ImageSize = "1024x1024" | "1536x1024" | "1024x1536";

export type FalGptImage1p5EditImageSize =
  | "auto"
  | "1024x1024"
  | "1536x1024"
  | "1024x1536";

export type FalGptImage1p5Background = "auto" | "transparent" | "opaque";

export type FalGptImage1p5Quality = "low" | "medium" | "high";

export type FalGptImage1p5OutputFormat = "jpeg" | "png" | "webp";

export type FalGptImage1p5InputFidelity = "low" | "high";

export interface FalGptImage1p5Response {
  images: FalFile[];
}

export interface FalGptImage1p5EditResponse {
  images: FalFile[];
}

// Nano Banana (original variant, text-to-image and edit)
export type FalNanoBananaAspectRatio =
  | "21:9"
  | "16:9"
  | "3:2"
  | "4:3"
  | "5:4"
  | "1:1"
  | "4:5"
  | "3:4"
  | "2:3"
  | "9:16";

export type FalNanoBananaEditAspectRatio = "auto" | FalNanoBananaAspectRatio;

export type FalNanoBananaOutputFormat = "jpeg" | "png" | "webp";

export type FalNanoBananaSafetyTolerance = "1" | "2" | "3" | "4" | "5" | "6";

export interface FalNanoBananaTextToImageResponse {
  images: FalFile[];
  description: string;
}

export interface FalNanoBananaEditResponse {
  images: FalFile[];
  description: string;
}

// Bytedance Seedream v5 Lite image editing
export type FalSeedreamV5LiteImageSize = NonNullable<
  FalSeedreamV5LiteTextToImageParams["image_size"]
>;

export interface FalSeedreamV5LiteEditResponse {
  images: FalFile[];
  seed: number;
}

// Bytedance Seedream v5 Lite text-to-image
export interface FalSeedreamV5LiteTextToImageResponse {
  images: FalFile[];
  seed: number;
}

// Bytedance Seedream v5 Pro layerize. fal's `Image` schema requires only
// `url` and makes every other field nullable, including the `width`/`height`
// that plain FalFile does not carry, so the item shape is modelled directly.
export interface FalSeedreamV5ProLayerizeImage {
  url: string;
  content_type?: string | null;
  file_name?: string | null;
  file_size?: number | null;
  width?: number | null;
  height?: number | null;
}
// Bytedance Seedream v5 Pro text-to-image output. fal's `Image` schema
// requires only `url` and makes every other field nullable, including the
// `width`/`height` that plain FalFile does not carry, so the item shape is
// modelled directly. Unlike the Lite surface the Pro response carries no
// `seed`.
export interface FalSeedreamV5ProTextToImageImage {
  url: string;
  content_type?: string | null;
  file_name?: string | null;
  file_size?: number | null;
  width?: number | null;
  height?: number | null;
}
// Bytedance Seedream v5 Pro image editing. fal's `Image` schema requires only
// `url` and makes every other field nullable, including the `width`/`height`
// that plain FalFile does not carry, so the item shape is modelled directly.
// Unlike the Lite surface the Pro response carries no `seed`.
export interface FalSeedreamV5ProEditImage {
  url: string;
  content_type?: string | null;
  file_name?: string | null;
  file_size?: number | null;
  width?: number | null;
  height?: number | null;
}

// Layer bounds in the output base image's coordinate system. `normalized`
// uses the integer range [0, 1000]; `absolute` uses pixels.
export interface FalSeedreamV5ProLayerBoundingBox {
  absolute: number[];
  normalized: number[];
}

// The base image (z_index 0) carries no name, description or bounding box;
// every separated layer does.
export interface FalSeedreamV5ProLayer {
  image: FalSeedreamV5ProLayerizeImage;
  z_index: number;
  bounding_box?: FalSeedreamV5ProLayerBoundingBox | null;
  name?: string | null;
  description?: string | null;
}

export interface FalSeedreamV5ProLayerizeResponse {
  images: FalSeedreamV5ProLayerizeImage[];
  layers: FalSeedreamV5ProLayer[];
}
export interface FalSeedreamV5ProTextToImageResponse {
  images: FalSeedreamV5ProTextToImageImage[];
}
export interface FalSeedreamV5ProEditResponse {
  images: FalSeedreamV5ProEditImage[];
}

// Bytedance Seed Speech TTS v2
export type FalSeedSpeechTtsV2Voice =
  | "vivi_mixed_en_zh_ja_es_id"
  | "mindy_en_es_id_pt_zh"
  | "stokie_en"
  | "dacey_en"
  | "tim_en"
  | "kian_en_zh"
  | "cedric_en_zh"
  | "sophie_en_zh"
  | "jean_en_zh"
  | "magnus_en_zh"
  | "mabel_en_zh"
  | "nadia_en_zh"
  | "opal_en_zh"
  | "pearl_en_zh"
  | "quentin_en_zh"
  | "vienna_mixed_en_zh"
  | "alina_mixed_en_zh"
  | "corinne_mixed_en_zh"
  | "esther_mixed_en_zh"
  | "freya_mixed_en_zh"
  | "gigi_mixed_en_zh"
  | "holly_mixed_en_zh"
  | "lyla_mixed_en_zh"
  | "daisy_mixed_en_zh"
  | "tracy_es_zh"
  | "jess_ja_es_id_pt_en_zh"
  | "pinky_es_ko_mixed_en_zh"
  | "sweety_ja_es"
  | "sandy_es_mixed_en_zh"
  | "sven_de"
  | "minimi_ja"
  | "usseau_fr"
  | "felipe_es"
  | "han_id"
  | "martins_pt"
  | "enzo_it"
  | "shane_ko"
  | "bonnie_zh"
  | "felix_zh"
  | "celeste_zh"
  | "monkey_king_zh";

export type FalSeedSpeechTtsV2OutputFormat = "mp3" | "opus";

export type FalSeedSpeechTtsV2SampleRate =
  | 8000
  | 16000
  | 22050
  | 24000
  | 32000
  | 44100
  | 48000;

export type FalSeedSpeechTtsV2Language =
  | "zh"
  | "en"
  | "ja"
  | "es-mx"
  | "id"
  | "pt-br"
  | "ko"
  | "it"
  | "de"
  | "fr";

export interface FalSeedSpeechTtsV2Response {
  audio: FalFile;
}

// MiniMax Music 3 — one generated song. `duration` is the length the model
// actually produced, which upstream documents as possibly shorter than the
// requested upper bound, and `seed` echoes the seed used.
export interface FalMinimaxMusic3Response {
  audio: FalFile;
  seed: number;
  duration: number;
}

// Alibaba Qwen Image 3 text-to-image
export interface FalAlibabaQwenImage3TextToImageResponse {
  images: FalFile[];
  seed: number;
}

// Alibaba Qwen Image 3 edit
export interface FalAlibabaQwenImage3EditResponse {
  images: FalFile[];
  seed: number;
}

// Wan v2.7 text-to-image
export type FalWanImageSize =
  | "square_hd"
  | "square"
  | "portrait_4_3"
  | "portrait_16_9"
  | "landscape_4_3"
  | "landscape_16_9"
  | { width: number; height: number };

export interface FalWanV2p7TextToImageResponse {
  images: FalFile[];
  generated_text?: string;
  seed: number;
}

export interface FalWanV2p7EditResponse {
  images: FalFile[];
  seed: number;
}

// Hunyuan Image v3 Instruct Edit
export type FalHunyuanImageV3ImageSize =
  | "square_hd"
  | "square"
  | "portrait_4_3"
  | "portrait_16_9"
  | "landscape_4_3"
  | "landscape_16_9"
  | "auto"
  | { width: number; height: number };

export interface FalHunyuanImageV3InstructEditResponse {
  images: FalFile[];
  seed: number;
}

export interface FalWanV2p7TextToVideoResponse {
  video: FalVideoFile;
  seed: number;
  actual_prompt?: string;
}

export interface FalWanV2p7ImageToVideoResponse {
  video: FalVideoFile;
  seed: number;
  actual_prompt?: string;
}

export interface FalWanV2p7ReferenceToVideoResponse {
  video: FalVideoFile;
  seed: number;
  actual_prompt?: string;
}

export interface FalWanV2p7EditVideoResponse {
  video: FalVideoFile;
  seed: number;
  actual_prompt?: string;
}

// Alibaba Wan 3.0 video generation. Unlike Wan 2.7, the response always
// reports `duration` — the realized output length in seconds, which the
// smart-duration mode (`duration: null`) lets the model choose.
export interface FalWan3p0TextToVideoResponse {
  video: FalVideoFile;
  seed: number;
  duration: number;
  actual_prompt?: string | null;
}

export interface FalWan3p0ImageToVideoResponse {
  video: FalVideoFile;
  seed: number;
  duration: number;
  actual_prompt?: string | null;
}

export interface FalWan3p0ReferenceToVideoResponse {
  video: FalVideoFile;
  seed: number;
  duration: number;
  actual_prompt?: string | null;
}

// MiniMax Hailuo 03 (H3) text-to-video. Upstream returns the shared fal `File`
// schema with no media metadata beyond it, so the plain FalFile shape applies.
// `expanded_prompt` is null whenever expansion was disabled, left the prompt
// unchanged, or happened inside MiniMax's own hosted API.
export interface FalMinimaxH3TextToVideoResponse {
  video: FalFile;
  expanded_prompt?: string | null;
}
// MiniMax Hailuo 03 (H3) image-to-video. Upstream returns the shared fal
// `File` schema with no media metadata beyond it, so the plain FalFile shape
// applies. `expanded_prompt` is null whenever expansion was disabled, left the
// prompt unchanged, or happened inside MiniMax's own hosted API.
export interface FalMinimaxH3ImageToVideoResponse {
  video: FalFile;
  expanded_prompt?: string | null;
}
// MiniMax Hailuo 03 (H3) reference-to-video. Upstream returns the shared fal
// `File` schema with no media metadata beyond it, so the plain FalFile shape
// applies. `expanded_prompt` is null whenever expansion was disabled, left the
// prompt unchanged, or happened inside MiniMax's own hosted API.
export interface FalMinimaxH3ReferenceToVideoResponse {
  video: FalFile;
  expanded_prompt?: string | null;
}

// xAI Grok Imagine Image
export type FalXaiGrokImagineImageAspectRatio =
  | "2:1"
  | "20:9"
  | "19.5:9"
  | "16:9"
  | "4:3"
  | "3:2"
  | "1:1"
  | "2:3"
  | "3:4"
  | "9:16"
  | "9:19.5"
  | "9:20"
  | "1:2";

export type FalXaiGrokImagineImageResolution = "1k" | "2k";

export type FalXaiGrokImagineImageOutputFormat = "jpeg" | "png" | "webp";

export interface FalXaiGrokImagineImageResponse {
  images: FalFile[];
  revised_prompt: string;
}

export interface FalXaiGrokImagineImageV2p0TextToImageResponse {
  images: FalFile[];
  revised_prompt?: string | null;
}

export interface FalXaiGrokImagineImageV2p0EditResponse {
  images: FalFile[];
  revised_prompt?: string | null;
}

export interface FalXaiGrokImagineImageEditResponse {
  images: FalFile[];
  revised_prompt: string;
}

// xAI Grok Imagine Video (image-to-video)
export type FalXaiGrokImagineVideoAspectRatio =
  | "auto"
  | "16:9"
  | "4:3"
  | "3:2"
  | "1:1"
  | "2:3"
  | "3:4"
  | "9:16";

export type FalXaiGrokImagineVideoResolution = "480p" | "720p";

export type FalXaiGrokImagineVideoReferenceAspectRatio =
  | "16:9"
  | "4:3"
  | "3:2"
  | "1:1"
  | "2:3"
  | "3:4"
  | "9:16";

export interface FalXaiGrokImagineVideoImageToVideoResponse {
  video: FalFile;
}

export interface FalXaiGrokImagineVideoReferenceToVideoResponse {
  video: FalFile;
}

// v1.5 returns upstream's full `VideoFile` (dimensions, fps, num_frames)
// rather than the bare file the unversioned sibling is typed against.
export interface FalXaiGrokImagineVideoV1p5ReferenceToVideoResponse {
  video: FalVideoFile;
}

export interface FalXaiGrokImagineVideoExtendVideoResponse {
  video: FalFile;
}

export type FalXaiGrokImagineVideoEditResolution = "auto" | "480p" | "720p";

export interface FalXaiGrokImagineVideoEditVideoResponse {
  video: FalFile;
}

// Google Veo 3.1 (text-to-video and image-to-video)
export type FalVeo3p1AspectRatio = "16:9" | "9:16";

export type FalVeo3p1ImageToVideoAspectRatio = "auto" | FalVeo3p1AspectRatio;

export type FalVeo3p1Duration = "4s" | "6s" | "8s";

export type FalVeo3p1Resolution = "720p" | "1080p" | "4k";

export type FalVeo3p1SafetyTolerance = "1" | "2" | "3" | "4" | "5" | "6";

export interface FalVeo3p1TextToVideoResponse {
  video: FalFile;
}

export interface FalVeo3p1ImageToVideoResponse {
  video: FalFile;
}

// Kling Video v3 Pro (image-to-video)
export interface FalKlingV3MultiPromptElement {
  prompt: string;
  duration?: string;
}

export interface FalKlingV3ComboElementInput {
  frontal_image_url?: string;
  reference_image_urls?: string[];
  video_url?: string;
  voice_id?: string;
}

export interface FalKlingVideoV3ProImageToVideoResponse {
  video: FalFile;
}

export interface FalKlingVideoV3ProTextToVideoResponse {
  video: FalFile;
}

export interface FalKlingVideoV3StandardImageToVideoResponse {
  video: FalFile;
}

export interface FalKlingVideoV3StandardTextToVideoResponse {
  video: FalFile;
}

export interface FalKlingVideoO3p4kImageToVideoResponse {
  video: FalFile;
}

export interface FalKlingVideoO3p4kReferenceToVideoResponse {
  video: FalFile;
}

export interface FalKlingVideoO3p4kTextToVideoResponse {
  video: FalFile;
}

// OpenAI Sora 2 (text-to-video and image-to-video)
export type FalSora2Model =
  | "sora-2"
  | "sora-2-2025-12-08"
  | "sora-2-2025-10-06";

export type FalSora2AspectRatio = "9:16" | "16:9";

export type FalSora2ImageToVideoAspectRatio = "auto" | FalSora2AspectRatio;

export type FalSora2Resolution = "720p";

export type FalSora2ImageToVideoResolution = "auto" | "720p";

export type FalSora2Duration = 4 | 8 | 12 | 16 | 20;

export interface FalSora2TextToVideoResponse {
  video: FalFile;
  video_id: string;
  thumbnail: FalFile | null;
  spritesheet: FalFile | null;
}

export interface FalSora2ImageToVideoResponse {
  video: FalFile;
  video_id: string;
  thumbnail: FalFile | null;
  spritesheet: FalFile | null;
}

// ==================== Serverless Logs ====================

// Label filter for log queries
export interface FalLabelFilter {
  key: string;
  value: string | string[];
  condition_type?: "equals" | "in" | "not_equals" | "not_in";
}

// Run source for serverless logs
export type FalRunSource = "grpc-run" | "grpc-register" | "gateway" | "cron";

// Log entry returned by stream events
export interface FalLogEntry {
  timestamp: string;
  level: string;
  message: string;
  app: string;
  revision: string;
  labels?: Record<string, string>;
}

// ==================== Serverless Files ====================

// File/directory item in a listing
export interface FalFileItem {
  path: string;
  name: string;
  created_time: string;
  updated_time: string;
  is_file: boolean;
  size: number;
  checksum_sha256?: string;
  checksum_md5?: string;
}

// List files parameters
export interface FalFilesListParams {
  dir?: string;
}

// ==================== Queue ====================

// Queue submit response
export interface FalQueueSubmitResponse {
  request_id: string;
  response_url: string;
  status_url: string;
  cancel_url: string;
  queue_position: number;
}

// Queue status parameters
export interface FalQueueStatusParams {
  endpoint_id: string;
  request_id: string;
  logs?: boolean;
}

// Queue result parameters (fetches the completed response body)
export interface FalQueueResultParams {
  endpoint_id: string;
  request_id: string;
}

// Queue result response — endpoint-specific, so untyped
export type FalQueueResultResponse = Record<string, unknown>;

// Queue log entry
export interface FalQueueLog {
  message: string;
  level: "STDERR" | "STDOUT" | "ERROR" | "INFO" | "WARN" | "DEBUG";
  source: string;
  timestamp: string;
}

// Queue metrics
export interface FalQueueMetrics {
  inference_time: number | null;
}

// Queue status: IN_QUEUE
export interface FalQueueInQueueStatus {
  status: "IN_QUEUE";
  request_id: string;
  response_url: string;
  queue_position: number;
}

// Queue status: IN_PROGRESS
export interface FalQueueInProgressStatus {
  status: "IN_PROGRESS";
  request_id: string;
  response_url: string;
  logs?: FalQueueLog[];
}

// Queue status: COMPLETED
export interface FalQueueCompletedStatus {
  status: "COMPLETED";
  request_id: string;
  response_url: string;
  logs?: FalQueueLog[];
  metrics?: FalQueueMetrics;
  error?: string;
  error_type?: string;
}

// Queue status response (discriminated union)
export type FalQueueStatusResponse =
  | FalQueueInQueueStatus
  | FalQueueInProgressStatus
  | FalQueueCompletedStatus;

// ==================== Serverless Apps Queue ====================

// Get queue size parameters
export interface FalAppsQueueParams {
  owner: string;
  name: string;
}

// Get queue size response
export interface FalAppsQueueResponse {
  queue_size: number;
}

// ==================== Provider ====================

// Namespace types
interface FalPricingEstimateMethod {
  (req: FalEstimateRequest, signal?: AbortSignal): Promise<FalEstimateResponse>;
  schema: ApicitySchema<FalEstimateRequest>;
}

interface FalModelsPricingNamespace {
  (params: FalPricingParams, signal?: AbortSignal): Promise<FalPricingResponse>;
  estimate: FalPricingEstimateMethod;
}

interface FalGetV1ModelsPricingNamespace {
  (params: FalPricingParams, signal?: AbortSignal): Promise<FalPricingResponse>;
}

interface FalDeletePayloadsMethod {
  (
    params: FalDeletePayloadsParams,
    signal?: AbortSignal
  ): Promise<FalDeletePayloadsResponse>;
  schema: ApicitySchema<FalDeletePayloadsParams>;
}

interface FalModelsRequestsNamespace {
  byEndpoint(
    params: FalRequestsParams,
    signal?: AbortSignal
  ): Promise<FalRequestsResponse>;
  payloads: FalDeletePayloadsMethod;
}

interface FalModelsNamespace {
  (
    params?: FalModelSearchParams,
    signal?: AbortSignal
  ): Promise<FalModelSearchResponse>;
  pricing: FalModelsPricingNamespace;
  usage(
    params?: FalUsageParams,
    signal?: AbortSignal
  ): Promise<FalUsageResponse>;
  analytics(
    params: FalAnalyticsParams,
    signal?: AbortSignal
  ): Promise<FalAnalyticsResponse>;
  requests: FalModelsRequestsNamespace;
}

interface FalQueueSubmitMethod {
  <Id extends string>(
    params: FalQueueSubmitRequest<Id>,
    signal?: AbortSignal
  ): Promise<FalQueueSubmitResponse>;
  schema: ApicitySchema<FalQueueSubmitParams>;
}

interface FalQueueNamespace {
  submit: FalQueueSubmitMethod;
  status(
    params: FalQueueStatusParams,
    signal?: AbortSignal
  ): Promise<FalQueueStatusResponse>;
  result(
    params: FalQueueResultParams,
    signal?: AbortSignal
  ): Promise<FalQueueResultResponse>;
}

// Serverless logs namespace types
interface FalLogsStreamMethod {
  (
    params?: FalLogsStreamParams,
    body?: FalLabelFilter[],
    signal?: AbortSignal
  ): Promise<AsyncIterable<FalLogEntry>>;
  schema: ApicitySchema<FalLogsStreamParams>;
}

interface FalServerlessLogsNamespace {
  stream: FalLogsStreamMethod;
}

// Serverless files namespace types
interface FalFilesUploadUrlMethod {
  (params: FalFilesUploadUrlParams, signal?: AbortSignal): Promise<boolean>;
  schema: ApicitySchema<FalFilesUploadUrlParams>;
}

interface FalFilesUploadLocalMethod {
  (params: FalFilesUploadLocalParams, signal?: AbortSignal): Promise<boolean>;
  schema: ApicitySchema<FalFilesUploadLocalParams>;
}

interface FalServerlessFilesNamespace {
  list(
    params?: FalFilesListParams,
    signal?: AbortSignal
  ): Promise<FalFileItem[]>;
  uploadUrl: FalFilesUploadUrlMethod;
  uploadLocal: FalFilesUploadLocalMethod;
}

interface FalServerlessAppsQueueNamespace {
  (
    params: FalAppsQueueParams,
    signal?: AbortSignal
  ): Promise<FalAppsQueueResponse>;
}

interface FalServerlessAppsNamespace {
  queue: FalServerlessAppsQueueNamespace;
}

interface FalServerlessNamespace {
  logs: FalServerlessLogsNamespace;
  files: FalServerlessFilesNamespace;
  apps: FalServerlessAppsNamespace;
  metrics(signal?: AbortSignal): Promise<string>;
}

interface FalWorkflowsNamespace {
  (
    params?: FalWorkflowListParams,
    signal?: AbortSignal
  ): Promise<FalWorkflowListResponse>;
  get(
    params: FalWorkflowGetParams,
    signal?: AbortSignal
  ): Promise<FalWorkflowGetResponse>;
}

interface FalV1Namespace {
  models: FalModelsNamespace;
  queue: FalQueueNamespace;
  serverless: FalServerlessNamespace;
  workflows: FalWorkflowsNamespace;
}

// ==================== fal.run run-namespace ====================

type FalSeedance2p0ImageToVideoFn = ((
  params: FalSeedance2p0ImageToVideoRequest,
  signal?: AbortSignal
) => Promise<FalSeedance2p0ImageToVideoResponse>) & {
  schema: ApicitySchema<FalSeedance2p0ImageToVideoRequest>;
};

type FalSeedance2p0TextToVideoFn = ((
  params: FalSeedance2p0TextToVideoRequest,
  signal?: AbortSignal
) => Promise<FalSeedance2p0TextToVideoResponse>) & {
  schema: ApicitySchema<FalSeedance2p0TextToVideoRequest>;
};

type FalSeedance2p0FastImageToVideoFn = ((
  params: FalSeedance2p0FastImageToVideoRequest,
  signal?: AbortSignal
) => Promise<FalSeedance2p0FastImageToVideoResponse>) & {
  schema: ApicitySchema<FalSeedance2p0FastImageToVideoRequest>;
};

type FalSeedance2p0FastTextToVideoFn = ((
  params: FalSeedance2p0FastTextToVideoRequest,
  signal?: AbortSignal
) => Promise<FalSeedance2p0FastTextToVideoResponse>) & {
  schema: ApicitySchema<FalSeedance2p0FastTextToVideoRequest>;
};

type FalSeedance2p0ReferenceToVideoFn = ((
  params: FalSeedance2p0ReferenceToVideoRequest,
  signal?: AbortSignal
) => Promise<FalSeedance2p0ReferenceToVideoResponse>) & {
  schema: ApicitySchema<FalSeedance2p0ReferenceToVideoRequest>;
};

type FalSeedance2p0FastReferenceToVideoFn = ((
  params: FalSeedance2p0FastReferenceToVideoRequest,
  signal?: AbortSignal
) => Promise<FalSeedance2p0FastReferenceToVideoResponse>) & {
  schema: ApicitySchema<FalSeedance2p0FastReferenceToVideoRequest>;
};

type FalSeedance2p5TextToVideoFn = ((
  params: FalSeedance2p5TextToVideoRequest,
  signal?: AbortSignal
) => Promise<FalSeedance2p5TextToVideoResponse>) & {
  schema: ApicitySchema<FalSeedance2p5TextToVideoRequest>;
};

type FalSeedance2p5ImageToVideoFn = ((
  params: FalSeedance2p5ImageToVideoRequest,
  signal?: AbortSignal
) => Promise<FalSeedance2p5ImageToVideoResponse>) & {
  schema: ApicitySchema<FalSeedance2p5ImageToVideoRequest>;
};

type FalSeedance2p5ReferenceToVideoFn = ((
  params: FalSeedance2p5ReferenceToVideoRequest,
  signal?: AbortSignal
) => Promise<FalSeedance2p5ReferenceToVideoResponse>) & {
  schema: ApicitySchema<FalSeedance2p5ReferenceToVideoRequest>;
};

export interface FalRunBytedanceSeedance2p0FastNamespace {
  imageToVideo: FalSeedance2p0FastImageToVideoFn;
  textToVideo: FalSeedance2p0FastTextToVideoFn;
  referenceToVideo: FalSeedance2p0FastReferenceToVideoFn;
}

export interface FalRunBytedanceSeedance2p0Namespace {
  imageToVideo: FalSeedance2p0ImageToVideoFn;
  textToVideo: FalSeedance2p0TextToVideoFn;
  referenceToVideo: FalSeedance2p0ReferenceToVideoFn;
  fast: FalRunBytedanceSeedance2p0FastNamespace;
}

export interface FalRunBytedanceSeedance2p5Namespace {
  imageToVideo: FalSeedance2p5ImageToVideoFn;
  referenceToVideo: FalSeedance2p5ReferenceToVideoFn;
  textToVideo: FalSeedance2p5TextToVideoFn;
}

export interface FalRunBytedanceSeedreamV5LiteNamespace {
  edit: FalSeedreamV5LiteEditFn;
  textToImage: FalSeedreamV5LiteTextToImageFn;
}

export interface FalRunBytedanceSeedreamV5ProNamespace {
  layerize: FalSeedreamV5ProLayerizeFn;
  textToImage: FalSeedreamV5ProTextToImageFn;
  edit: FalSeedreamV5ProEditFn;
}

export interface FalRunBytedanceSeedreamV5Namespace {
  flash: FalRunBytedanceSeedreamV5FlashNamespace;

  lite: FalRunBytedanceSeedreamV5LiteNamespace;
  pro: FalRunBytedanceSeedreamV5ProNamespace;
}

export interface FalRunBytedanceSeedreamNamespace {
  v5: FalRunBytedanceSeedreamV5Namespace;
}

type FalSeedSpeechTtsV2Fn = ((
  params: FalSeedSpeechTtsV2Request,
  signal?: AbortSignal
) => Promise<FalSeedSpeechTtsV2Response>) & {
  schema: ApicitySchema<FalSeedSpeechTtsV2Request>;
};

export interface FalRunBytedanceSeedSpeechTtsNamespace {
  v2: FalSeedSpeechTtsV2Fn;
}

type FalMinimaxMusic3Fn = ((
  params: FalMinimaxMusic3Request,
  signal?: AbortSignal
) => Promise<FalMinimaxMusic3Response>) & {
  schema: ApicitySchema<FalMinimaxMusic3Request>;
};

export interface FalRunMinimaxNamespace {
  music3: FalMinimaxMusic3Fn;
  h3: FalRunMinimaxH3Namespace;
}

export interface FalRunBytedanceSeedSpeechNamespace {
  tts: FalRunBytedanceSeedSpeechTtsNamespace;
}

export interface FalRunBytedanceNamespace {
  seedance2p0: FalRunBytedanceSeedance2p0Namespace;
  seedance2p5: FalRunBytedanceSeedance2p5Namespace;
  seedSpeech: FalRunBytedanceSeedSpeechNamespace;
  seedream: FalRunBytedanceSeedreamNamespace;
}

type FalMinimaxH3TextToVideoFn = ((
  params: FalMinimaxH3TextToVideoRequest,
  signal?: AbortSignal
) => Promise<FalMinimaxH3TextToVideoResponse>) & {
  schema: ApicitySchema<FalMinimaxH3TextToVideoRequest>;
};

export interface FalRunMinimaxH3Namespace {
  textToVideo: FalMinimaxH3TextToVideoFn;
}
type FalMinimaxH3ImageToVideoFn = ((
  params: FalMinimaxH3ImageToVideoRequest,
  signal?: AbortSignal
) => Promise<FalMinimaxH3ImageToVideoResponse>) & {
  schema: ApicitySchema<FalMinimaxH3ImageToVideoRequest>;
};

export interface FalRunMinimaxH3Namespace {
  imageToVideo: FalMinimaxH3ImageToVideoFn;
}

export interface FalRunMinimaxNamespace {
  h3: FalRunMinimaxH3Namespace;
}

type FalNanoBananaProEditFn = ((
  params: FalNanoBananaProEditRequest,
  signal?: AbortSignal
) => Promise<FalNanoBananaProEditResponse>) & {
  schema: ApicitySchema<FalNanoBananaProEditRequest>;
};

type FalNanoBananaProTextToImageFn = ((
  params: FalNanoBananaProTextToImageRequest,
  signal?: AbortSignal
) => Promise<FalNanoBananaProTextToImageResponse>) & {
  schema: ApicitySchema<FalNanoBananaProTextToImageRequest>;
};

export interface FalRunNanoBananaProNamespace {
  textToImage: FalNanoBananaProTextToImageFn;
  edit: FalNanoBananaProEditFn;
}

type FalNanoBanana2TextToImageFn = ((
  params: FalNanoBanana2TextToImageRequest,
  signal?: AbortSignal
) => Promise<FalNanoBanana2TextToImageResponse>) & {
  schema: ApicitySchema<FalNanoBanana2TextToImageRequest>;
};

type FalNanoBanana2EditFn = ((
  params: FalNanoBanana2EditRequest,
  signal?: AbortSignal
) => Promise<FalNanoBanana2EditResponse>) & {
  schema: ApicitySchema<FalNanoBanana2EditRequest>;
};

export interface FalRunNanoBanana2Namespace {
  textToImage: FalNanoBanana2TextToImageFn;
  edit: FalNanoBanana2EditFn;
}

type FalNanoBanana2LiteTextToImageFn = ((
  params: FalNanoBanana2LiteTextToImageRequest,
  signal?: AbortSignal
) => Promise<FalNanoBanana2LiteTextToImageResponse>) & {
  schema: ApicitySchema<FalNanoBanana2LiteTextToImageRequest>;
};

type FalNanoBanana2LiteEditFn = ((
  params: FalNanoBanana2LiteEditRequest,
  signal?: AbortSignal
) => Promise<FalNanoBanana2LiteEditResponse>) & {
  schema: ApicitySchema<FalNanoBanana2LiteEditRequest>;
};

export interface FalRunNanoBanana2LiteNamespace {
  textToImage: FalNanoBanana2LiteTextToImageFn;
  edit: FalNanoBanana2LiteEditFn;
}

type FalVirtualTryOnFn = ((
  params: FalVirtualTryOnRequest,
  signal?: AbortSignal
) => Promise<FalVirtualTryOnResponse>) & {
  schema: ApicitySchema<FalVirtualTryOnRequest>;
};

type FalTopazUpscaleImagePrecisionFn = ((
  params: FalTopazUpscaleImagePrecisionRequest,
  signal?: AbortSignal
) => Promise<FalTopazUpscaleImagePrecisionResponse>) & {
  schema: ApicitySchema<FalTopazUpscaleImagePrecisionRequest>;
};

export interface FalRunTopazUpscaleImageNamespace {
  precision: FalTopazUpscaleImagePrecisionFn;
}

type FalTopazUpscaleVideoPrecisionFn = ((
  params: FalTopazUpscaleVideoPrecisionRequest,
  signal?: AbortSignal
) => Promise<FalTopazUpscaleVideoPrecisionResponse>) & {
  schema: ApicitySchema<FalTopazUpscaleVideoPrecisionRequest>;
};

export interface FalRunTopazUpscaleVideoNamespace {
  precision: FalTopazUpscaleVideoPrecisionFn;
}

export interface FalRunTopazUpscaleNamespace {
  image: FalRunTopazUpscaleImageNamespace;
  video: FalRunTopazUpscaleVideoNamespace;
}

export interface FalRunTopazNamespace {
  upscale: FalRunTopazUpscaleNamespace;
}
type FalMeshyV7ImageTo3dFn = ((
  params: FalMeshyV7ImageTo3dRequest,
  signal?: AbortSignal
) => Promise<FalMeshyV7ImageTo3dResponse>) & {
  schema: ApicitySchema<FalMeshyV7ImageTo3dRequest>;
};

export interface FalRunMeshyV7Namespace {
  imageTo3d: FalMeshyV7ImageTo3dFn;
}

export interface FalRunMeshyNamespace {
  v7p1: FalRunMeshyV7p1Namespace;

  v7: FalRunMeshyV7Namespace;
}

type FalGeminiOmniFlashFn = ((
  params: FalGeminiOmniFlashRequest,
  signal?: AbortSignal
) => Promise<FalGeminiOmniFlashResponse>) & {
  schema: ApicitySchema<FalGeminiOmniFlashRequest>;
  v1p1: FalRunGeminiOmniFlashV1p1Namespace;
  edit: FalGeminiOmniFlashEditFn;
  imageToVideo: FalGeminiOmniFlashImageToVideoFn;
  referenceToVideo: FalGeminiOmniFlashReferenceToVideoFn;
};

type FalGeminiOmniFlashEditFn = ((
  params: FalGeminiOmniFlashEditRequest,
  signal?: AbortSignal
) => Promise<FalGeminiOmniFlashEditResponse>) & {
  schema: ApicitySchema<FalGeminiOmniFlashEditRequest>;
};

type FalGeminiOmniFlashImageToVideoFn = ((
  params: FalGeminiOmniFlashImageToVideoRequest,
  signal?: AbortSignal
) => Promise<FalGeminiOmniFlashImageToVideoResponse>) & {
  schema: ApicitySchema<FalGeminiOmniFlashImageToVideoRequest>;
};

type FalGeminiOmniFlashReferenceToVideoFn = ((
  params: FalGeminiOmniFlashReferenceToVideoRequest,
  signal?: AbortSignal
) => Promise<FalGeminiOmniFlashReferenceToVideoResponse>) & {
  schema: ApicitySchema<FalGeminiOmniFlashReferenceToVideoRequest>;
};

type FalGeminiOmniFlashV1p1EditFn = ((
  params: FalGeminiOmniFlashV1p1EditRequest,
  signal?: AbortSignal
) => Promise<FalGeminiOmniFlashV1p1EditResponse>) & {
  schema: ApicitySchema<FalGeminiOmniFlashV1p1EditRequest>;
};

type FalGeminiOmniFlashV1p1ReferenceToVideoFn = ((
  params: FalGeminiOmniFlashV1p1ReferenceToVideoRequest,
  signal?: AbortSignal
) => Promise<FalGeminiOmniFlashV1p1ReferenceToVideoResponse>) & {
  schema: ApicitySchema<FalGeminiOmniFlashV1p1ReferenceToVideoRequest>;
};

type FalGeminiOmniFlashV1p1ImageToVideoFn = ((
  params: FalGeminiOmniFlashV1p1ImageToVideoRequest,
  signal?: AbortSignal
) => Promise<FalGeminiOmniFlashV1p1ImageToVideoResponse>) & {
  schema: ApicitySchema<FalGeminiOmniFlashV1p1ImageToVideoRequest>;
};

type FalGeminiOmniFlashV1p1TextToVideoFn = ((
  params: FalGeminiOmniFlashV1p1TextToVideoRequest,
  signal?: AbortSignal
) => Promise<FalGeminiOmniFlashV1p1TextToVideoResponse>) & {
  schema: ApicitySchema<FalGeminiOmniFlashV1p1TextToVideoRequest>;
};

export interface FalRunGeminiOmniFlashV1p1Namespace {
  textToVideo: FalGeminiOmniFlashV1p1TextToVideoFn;
  imageToVideo: FalGeminiOmniFlashV1p1ImageToVideoFn;
  referenceToVideo: FalGeminiOmniFlashV1p1ReferenceToVideoFn;
  edit: FalGeminiOmniFlashV1p1EditFn;
}

type FalSeedreamV5LiteEditFn = ((
  params: FalSeedreamV5LiteEditRequest,
  signal?: AbortSignal
) => Promise<FalSeedreamV5LiteEditResponse>) & {
  schema: ApicitySchema<FalSeedreamV5LiteEditRequest>;
};

type FalSeedreamV5LiteTextToImageFn = ((
  params: FalSeedreamV5LiteTextToImageRequest,
  signal?: AbortSignal
) => Promise<FalSeedreamV5LiteTextToImageResponse>) & {
  schema: ApicitySchema<FalSeedreamV5LiteTextToImageRequest>;
};

type FalSeedreamV5ProLayerizeFn = ((
  params: FalSeedreamV5ProLayerizeRequest,
  signal?: AbortSignal
) => Promise<FalSeedreamV5ProLayerizeResponse>) & {
  schema: ApicitySchema<FalSeedreamV5ProLayerizeRequest>;
};
type FalSeedreamV5ProTextToImageFn = ((
  params: FalSeedreamV5ProTextToImageRequest,
  signal?: AbortSignal
) => Promise<FalSeedreamV5ProTextToImageResponse>) & {
  schema: ApicitySchema<FalSeedreamV5ProTextToImageRequest>;
};
type FalSeedreamV5ProEditFn = ((
  params: FalSeedreamV5ProEditRequest,
  signal?: AbortSignal
) => Promise<FalSeedreamV5ProEditResponse>) & {
  schema: ApicitySchema<FalSeedreamV5ProEditRequest>;
};

type FalAlibabaQwenImage3TextToImageFn = ((
  params: FalAlibabaQwenImage3TextToImageRequest,
  signal?: AbortSignal
) => Promise<FalAlibabaQwenImage3TextToImageResponse>) & {
  schema: ApicitySchema<FalAlibabaQwenImage3TextToImageRequest>;
};

type FalAlibabaQwenImage3EditFn = ((
  params: FalAlibabaQwenImage3EditRequest,
  signal?: AbortSignal
) => Promise<FalAlibabaQwenImage3EditResponse>) & {
  schema: ApicitySchema<FalAlibabaQwenImage3EditRequest>;
};

export interface FalRunAlibabaQwenImage3Namespace {
  textToImage: FalAlibabaQwenImage3TextToImageFn;
  edit: FalAlibabaQwenImage3EditFn;
}

type FalWan3p0TextToVideoFn = ((
  params: FalWan3p0TextToVideoRequest,
  signal?: AbortSignal
) => Promise<FalWan3p0TextToVideoResponse>) & {
  schema: ApicitySchema<FalWan3p0TextToVideoRequest>;
};

type FalWan3p0ImageToVideoFn = ((
  params: FalWan3p0ImageToVideoRequest,
  signal?: AbortSignal
) => Promise<FalWan3p0ImageToVideoResponse>) & {
  schema: ApicitySchema<FalWan3p0ImageToVideoRequest>;
};

type FalWan3p0ReferenceToVideoFn = ((
  params: FalWan3p0ReferenceToVideoRequest,
  signal?: AbortSignal
) => Promise<FalWan3p0ReferenceToVideoResponse>) & {
  schema: ApicitySchema<FalWan3p0ReferenceToVideoRequest>;
};

// The base and prime Wan 3.0 families expose the same three operations with
// the same request and response shapes; only their upstream billing differs.
export interface FalRunAlibabaWan3p0Namespace {
  textToVideo: FalWan3p0TextToVideoFn;
  imageToVideo: FalWan3p0ImageToVideoFn;
  referenceToVideo: FalWan3p0ReferenceToVideoFn;
}

export interface FalRunAlibabaNamespace {
  qwenImage3: FalRunAlibabaQwenImage3Namespace;
  wan3p0: FalRunAlibabaWan3p0Namespace;
  wan3p0Prime: FalRunAlibabaWan3p0Namespace;
}

type FalWanV2p7TextToImageFn = ((
  params: FalWanV2p7TextToImageRequest,
  signal?: AbortSignal
) => Promise<FalWanV2p7TextToImageResponse>) & {
  schema: ApicitySchema<FalWanV2p7TextToImageRequest>;
};

type FalWanV2p7EditFn = ((
  params: FalWanV2p7EditRequest,
  signal?: AbortSignal
) => Promise<FalWanV2p7EditResponse>) & {
  schema: ApicitySchema<FalWanV2p7EditRequest>;
};

type FalWanV2p7TextToVideoFn = ((
  params: FalWanV2p7TextToVideoRequest,
  signal?: AbortSignal
) => Promise<FalWanV2p7TextToVideoResponse>) & {
  schema: ApicitySchema<FalWanV2p7TextToVideoRequest>;
};

type FalWanV2p7ImageToVideoFn = ((
  params: FalWanV2p7ImageToVideoRequest,
  signal?: AbortSignal
) => Promise<FalWanV2p7ImageToVideoResponse>) & {
  schema: ApicitySchema<FalWanV2p7ImageToVideoRequest>;
};

type FalWanV2p7ReferenceToVideoFn = ((
  params: FalWanV2p7ReferenceToVideoRequest,
  signal?: AbortSignal
) => Promise<FalWanV2p7ReferenceToVideoResponse>) & {
  schema: ApicitySchema<FalWanV2p7ReferenceToVideoRequest>;
};

type FalWanV2p7EditVideoFn = ((
  params: FalWanV2p7EditVideoRequest,
  signal?: AbortSignal
) => Promise<FalWanV2p7EditVideoResponse>) & {
  schema: ApicitySchema<FalWanV2p7EditVideoRequest>;
};

export interface FalRunWanV2p7ProNamespace {
  textToImage: FalWanV2p7TextToImageFn;
  edit: FalWanV2p7EditFn;
}

export interface FalRunWanV2p7Namespace {
  textToImage: FalWanV2p7TextToImageFn;
  edit: FalWanV2p7EditFn;
  textToVideo: FalWanV2p7TextToVideoFn;
  imageToVideo: FalWanV2p7ImageToVideoFn;
  referenceToVideo: FalWanV2p7ReferenceToVideoFn;
  editVideo: FalWanV2p7EditVideoFn;
  pro: FalRunWanV2p7ProNamespace;
}

export interface FalRunWanNamespace {
  v2p7: FalRunWanV2p7Namespace;
}

type FalXaiGrokImagineImageEditFn = ((
  params: FalXaiGrokImagineImageEditRequest,
  signal?: AbortSignal
) => Promise<FalXaiGrokImagineImageEditResponse>) & {
  schema: ApicitySchema<FalXaiGrokImagineImageEditRequest>;
};

type FalXaiGrokImagineImageV2p0TextToImageFn = ((
  params: FalXaiGrokImagineImageV2p0TextToImageRequest,
  signal?: AbortSignal
) => Promise<FalXaiGrokImagineImageV2p0TextToImageResponse>) & {
  schema: ApicitySchema<FalXaiGrokImagineImageV2p0TextToImageRequest>;
};

type FalXaiGrokImagineImageV2p0EditFn = ((
  params: FalXaiGrokImagineImageV2p0EditRequest,
  signal?: AbortSignal
) => Promise<FalXaiGrokImagineImageV2p0EditResponse>) & {
  schema: ApicitySchema<FalXaiGrokImagineImageV2p0EditRequest>;
};

export interface FalRunXaiGrokImagineImageV2p0Namespace {
  textToImage: FalXaiGrokImagineImageV2p0TextToImageFn;
  edit: FalXaiGrokImagineImageV2p0EditFn;
}

type FalXaiGrokImagineImageFn = ((
  params: FalXaiGrokImagineImageRequest,
  signal?: AbortSignal
) => Promise<FalXaiGrokImagineImageResponse>) & {
  schema: ApicitySchema<FalXaiGrokImagineImageRequest>;
  edit: FalXaiGrokImagineImageEditFn;
  v2p0: FalRunXaiGrokImagineImageV2p0Namespace;
};

type FalXaiGrokImagineVideoImageToVideoFn = ((
  params: FalXaiGrokImagineVideoImageToVideoRequest,
  signal?: AbortSignal
) => Promise<FalXaiGrokImagineVideoImageToVideoResponse>) & {
  schema: ApicitySchema<FalXaiGrokImagineVideoImageToVideoRequest>;
};

type FalXaiGrokImagineVideoReferenceToVideoFn = ((
  params: FalXaiGrokImagineVideoReferenceToVideoRequest,
  signal?: AbortSignal
) => Promise<FalXaiGrokImagineVideoReferenceToVideoResponse>) & {
  schema: ApicitySchema<FalXaiGrokImagineVideoReferenceToVideoRequest>;
};

type FalXaiGrokImagineVideoV1p5ReferenceToVideoFn = ((
  params: FalXaiGrokImagineVideoV1p5ReferenceToVideoRequest,
  signal?: AbortSignal
) => Promise<FalXaiGrokImagineVideoV1p5ReferenceToVideoResponse>) & {
  schema: ApicitySchema<FalXaiGrokImagineVideoV1p5ReferenceToVideoRequest>;
};

type FalXaiGrokImagineVideoV1p5TextToVideoFn = ((
  params: FalXaiGrokImagineVideoV1p5TextToVideoRequest,
  signal?: AbortSignal
) => Promise<FalXaiGrokImagineVideoV1p5TextToVideoResponse>) & {
  schema: ApicitySchema<FalXaiGrokImagineVideoV1p5TextToVideoRequest>;
};

type FalXaiGrokImagineVideoV1p5ImageToVideoFn = ((
  params: FalXaiGrokImagineVideoV1p5ImageToVideoRequest,
  signal?: AbortSignal
) => Promise<FalXaiGrokImagineVideoV1p5ImageToVideoResponse>) & {
  schema: ApicitySchema<FalXaiGrokImagineVideoV1p5ImageToVideoRequest>;
};

type FalXaiGrokImagineVideoExtendVideoFn = ((
  params: FalXaiGrokImagineVideoExtendVideoRequest,
  signal?: AbortSignal
) => Promise<FalXaiGrokImagineVideoExtendVideoResponse>) & {
  schema: ApicitySchema<FalXaiGrokImagineVideoExtendVideoRequest>;
};

type FalXaiGrokImagineVideoEditVideoFn = ((
  params: FalXaiGrokImagineVideoEditVideoRequest,
  signal?: AbortSignal
) => Promise<FalXaiGrokImagineVideoEditVideoResponse>) & {
  schema: ApicitySchema<FalXaiGrokImagineVideoEditVideoRequest>;
};

export interface FalRunXaiGrokImagineVideoV1p5Namespace {
  imageToVideo: FalXaiGrokImagineVideoV1p5ImageToVideoFn;
  textToVideo: FalXaiGrokImagineVideoV1p5TextToVideoFn;
  referenceToVideo: FalXaiGrokImagineVideoV1p5ReferenceToVideoFn;
}

export interface FalRunXaiGrokImagineVideoNamespace {
  imageToVideo: FalXaiGrokImagineVideoImageToVideoFn;
  referenceToVideo: FalXaiGrokImagineVideoReferenceToVideoFn;
  extendVideo: FalXaiGrokImagineVideoExtendVideoFn;
  editVideo: FalXaiGrokImagineVideoEditVideoFn;
  v1p5: FalRunXaiGrokImagineVideoV1p5Namespace;
}

export interface FalRunXaiNamespace {
  grokImagineImage: FalXaiGrokImagineImageFn;
  grokImagineVideo: FalRunXaiGrokImagineVideoNamespace;
}

type FalQwenImageEditFn = ((
  params: FalQwenImageEditRequest,
  signal?: AbortSignal
) => Promise<FalQwenImageEditResponse>) & {
  schema: ApicitySchema<FalQwenImageEditRequest>;
};

type FalQwenImageFn = ((
  params: FalQwenImageRequest,
  signal?: AbortSignal
) => Promise<FalQwenImageResponse>) & {
  schema: ApicitySchema<FalQwenImageRequest>;
  edit: FalQwenImageEditFn;
};

type FalGptImage1p5EditFn = ((
  params: FalGptImage1p5EditRequest,
  signal?: AbortSignal
) => Promise<FalGptImage1p5EditResponse>) & {
  schema: ApicitySchema<FalGptImage1p5EditRequest>;
};

type FalGptImage1p5Fn = ((
  params: FalGptImage1p5Request,
  signal?: AbortSignal
) => Promise<FalGptImage1p5Response>) & {
  schema: ApicitySchema<FalGptImage1p5Request>;
  edit: FalGptImage1p5EditFn;
};

type FalNanoBananaTextToImageFn = ((
  params: FalNanoBananaTextToImageRequest,
  signal?: AbortSignal
) => Promise<FalNanoBananaTextToImageResponse>) & {
  schema: ApicitySchema<FalNanoBananaTextToImageRequest>;
};

type FalNanoBananaEditFn = ((
  params: FalNanoBananaEditRequest,
  signal?: AbortSignal
) => Promise<FalNanoBananaEditResponse>) & {
  schema: ApicitySchema<FalNanoBananaEditRequest>;
};

export interface FalRunNanoBananaNamespace {
  textToImage: FalNanoBananaTextToImageFn;
  edit: FalNanoBananaEditFn;
}

type FalVeo3p1TextToVideoFn = ((
  params: FalVeo3p1TextToVideoRequest,
  signal?: AbortSignal
) => Promise<FalVeo3p1TextToVideoResponse>) & {
  schema: ApicitySchema<FalVeo3p1TextToVideoRequest>;
};

type FalVeo3p1ImageToVideoFn = ((
  params: FalVeo3p1ImageToVideoRequest,
  signal?: AbortSignal
) => Promise<FalVeo3p1ImageToVideoResponse>) & {
  schema: ApicitySchema<FalVeo3p1ImageToVideoRequest>;
};

export interface FalRunVeo3p1Namespace {
  textToVideo: FalVeo3p1TextToVideoFn;
  imageToVideo: FalVeo3p1ImageToVideoFn;
}

type FalKlingVideoV3ProImageToVideoFn = ((
  params: FalKlingVideoV3ProImageToVideoRequest,
  signal?: AbortSignal
) => Promise<FalKlingVideoV3ProImageToVideoResponse>) & {
  schema: ApicitySchema<FalKlingVideoV3ProImageToVideoRequest>;
};

type FalKlingVideoV3ProTextToVideoFn = ((
  params: FalKlingVideoV3ProTextToVideoRequest,
  signal?: AbortSignal
) => Promise<FalKlingVideoV3ProTextToVideoResponse>) & {
  schema: ApicitySchema<FalKlingVideoV3ProTextToVideoRequest>;
};

type FalKlingVideoV3StandardImageToVideoFn = ((
  params: FalKlingVideoV3StandardImageToVideoRequest,
  signal?: AbortSignal
) => Promise<FalKlingVideoV3StandardImageToVideoResponse>) & {
  schema: ApicitySchema<FalKlingVideoV3StandardImageToVideoRequest>;
};

type FalKlingVideoV3StandardTextToVideoFn = ((
  params: FalKlingVideoV3StandardTextToVideoRequest,
  signal?: AbortSignal
) => Promise<FalKlingVideoV3StandardTextToVideoResponse>) & {
  schema: ApicitySchema<FalKlingVideoV3StandardTextToVideoRequest>;
};

export interface FalRunKlingVideoV3ProNamespace {
  imageToVideo: FalKlingVideoV3ProImageToVideoFn;
  textToVideo: FalKlingVideoV3ProTextToVideoFn;
}

export interface FalRunKlingVideoV3StandardNamespace {
  imageToVideo: FalKlingVideoV3StandardImageToVideoFn;
  textToVideo: FalKlingVideoV3StandardTextToVideoFn;
}

export interface FalRunKlingVideoV3Namespace {
  pro: FalRunKlingVideoV3ProNamespace;
  standard: FalRunKlingVideoV3StandardNamespace;
}

type FalKlingVideoO3p4kImageToVideoFn = ((
  params: FalKlingVideoO3p4kImageToVideoRequest,
  signal?: AbortSignal
) => Promise<FalKlingVideoO3p4kImageToVideoResponse>) & {
  schema: ApicitySchema<FalKlingVideoO3p4kImageToVideoRequest>;
};

type FalKlingVideoO3p4kReferenceToVideoFn = ((
  params: FalKlingVideoO3p4kReferenceToVideoRequest,
  signal?: AbortSignal
) => Promise<FalKlingVideoO3p4kReferenceToVideoResponse>) & {
  schema: ApicitySchema<FalKlingVideoO3p4kReferenceToVideoRequest>;
};

type FalKlingVideoO3p4kTextToVideoFn = ((
  params: FalKlingVideoO3p4kTextToVideoRequest,
  signal?: AbortSignal
) => Promise<FalKlingVideoO3p4kTextToVideoResponse>) & {
  schema: ApicitySchema<FalKlingVideoO3p4kTextToVideoRequest>;
};

export interface FalRunKlingVideoO3p4kNamespace {
  imageToVideo: FalKlingVideoO3p4kImageToVideoFn;
  referenceToVideo: FalKlingVideoO3p4kReferenceToVideoFn;
  textToVideo: FalKlingVideoO3p4kTextToVideoFn;
}

export interface FalRunKlingVideoNamespace {
  v3: FalRunKlingVideoV3Namespace;
  o3p4k: FalRunKlingVideoO3p4kNamespace;
}

type FalMinimaxH3ReferenceToVideoFn = ((
  params: FalMinimaxH3ReferenceToVideoRequest,
  signal?: AbortSignal
) => Promise<FalMinimaxH3ReferenceToVideoResponse>) & {
  schema: ApicitySchema<FalMinimaxH3ReferenceToVideoRequest>;
};

export interface FalRunMinimaxH3Namespace {
  referenceToVideo: FalMinimaxH3ReferenceToVideoFn;
}

export interface FalRunMinimaxNamespace {
  h3: FalRunMinimaxH3Namespace;
}

type FalSora2TextToVideoFn = ((
  params: FalSora2TextToVideoRequest,
  signal?: AbortSignal
) => Promise<FalSora2TextToVideoResponse>) & {
  schema: ApicitySchema<FalSora2TextToVideoRequest>;
};

type FalSora2ImageToVideoFn = ((
  params: FalSora2ImageToVideoRequest,
  signal?: AbortSignal
) => Promise<FalSora2ImageToVideoResponse>) & {
  schema: ApicitySchema<FalSora2ImageToVideoRequest>;
};

export interface FalRunSora2Namespace {
  textToVideo: FalSora2TextToVideoFn;
  imageToVideo: FalSora2ImageToVideoFn;
}

type FalHunyuanImageV3InstructEditFn = ((
  params: FalHunyuanImageV3InstructEditRequest,
  signal?: AbortSignal
) => Promise<FalHunyuanImageV3InstructEditResponse>) & {
  schema: ApicitySchema<FalHunyuanImageV3InstructEditRequest>;
};

export interface FalRunHunyuanV3Namespace {
  instructEdit: FalHunyuanImageV3InstructEditFn;
}

export interface FalRunHunyuanNamespace {
  v3: FalRunHunyuanV3Namespace;
}

type FalFlux3TextToVideoFn = ((
  params: FalFlux3TextToVideoRequest,
  signal?: AbortSignal
) => Promise<FalFlux3VideoResponse>) & {
  schema: ApicitySchema<FalFlux3TextToVideoRequest>;
};

type FalFlux3ImageToVideoFn = ((
  params: FalFlux3ImageToVideoRequest,
  signal?: AbortSignal
) => Promise<FalFlux3VideoResponse>) & {
  schema: ApicitySchema<FalFlux3ImageToVideoRequest>;
};

type FalFlux3FirstLastFrameToVideoFn = ((
  params: FalFlux3FirstLastFrameToVideoRequest,
  signal?: AbortSignal
) => Promise<FalFlux3VideoResponse>) & {
  schema: ApicitySchema<FalFlux3FirstLastFrameToVideoRequest>;
};

type FalFlux3KeyframesToVideoFn = ((
  params: FalFlux3KeyframesToVideoRequest,
  signal?: AbortSignal
) => Promise<FalFlux3VideoResponse>) & {
  schema: ApicitySchema<FalFlux3KeyframesToVideoRequest>;
};

type FalFlux3ExtendVideoFn = ((
  params: FalFlux3ExtendVideoRequest,
  signal?: AbortSignal
) => Promise<FalFlux3VideoResponse>) & {
  schema: ApicitySchema<FalFlux3ExtendVideoRequest>;
};

type FalFluxVideoUpscaleFn = ((
  params: FalFluxVideoUpscaleRequest,
  signal?: AbortSignal
) => Promise<FalFluxVideoUpscaleResponse>) & {
  schema: ApicitySchema<FalFluxVideoUpscaleRequest>;
};

export interface FalRunFlux3Namespace {
  extendVideo: FalFlux3ExtendVideoFn;
  firstLastFrameToVideo: FalFlux3FirstLastFrameToVideoFn;
  imageToVideo: FalFlux3ImageToVideoFn;
  keyframesToVideo: FalFlux3KeyframesToVideoFn;
  textToVideo: FalFlux3TextToVideoFn;
}

export interface FalRunBlackforestlabsNamespace {
  flux3: FalRunFlux3Namespace;
  fluxVideoUpscale: FalFluxVideoUpscaleFn;
}

type FalLtx2p5ImageToVideoProFn = ((
  params: FalLtx2p5ImageToVideoProRequest,
  signal?: AbortSignal
) => Promise<FalLtx2p5ImageToVideoProResponse>) & {
  schema: ApicitySchema<FalLtx2p5ImageToVideoProRequest>;
};

// `pro` is a URL segment, not a variant flag: upstream splits the LTX-2.5
// image-to-video model into `/pro` and `/fast` endpoints.
type FalLtx2p5ImageToVideoFastFn = ((
  params: FalLtx2p5ImageToVideoFastRequest,
  signal?: AbortSignal
) => Promise<FalLtx2p5ImageToVideoFastResponse>) & {
  schema: ApicitySchema<FalLtx2p5ImageToVideoFastRequest>;
};

// `fast` is a URL segment, not a variant flag: upstream splits the LTX-2.5
// image-to-video model into `/pro` and `/fast` endpoints, and the two do not
// share a request contract — the fast tier reaches 20s, 48 fps and 2160p.
export interface FalRunLightricksLtx2p5ImageToVideoNamespace {
  pro: FalLtx2p5ImageToVideoProFn;
  fast: FalLtx2p5ImageToVideoFastFn;
}

// The pro tier's contract is narrower than the fast tier's: up to 10
// seconds, 720p or 1080p, and 24, 25 or 50 FPS.
type FalLightricksLtx2p5TextToVideoProFn = ((
  params: FalLightricksLtx2p5TextToVideoProRequest,
  signal?: AbortSignal
) => Promise<FalLightricksLtx2p5TextToVideoProResponse>) & {
  schema: ApicitySchema<FalLightricksLtx2p5TextToVideoProRequest>;
};

type FalLightricksLtx2p5TextToVideoFastFn = ((
  params: FalLightricksLtx2p5TextToVideoFastRequest,
  signal?: AbortSignal
) => Promise<FalLightricksLtx2p5TextToVideoFastResponse>) & {
  schema: ApicitySchema<FalLightricksLtx2p5TextToVideoFastRequest>;
};

// `fast` is a URL segment, not a variant flag: upstream serves LTX-2.5
// text-to-video at `/fast` and `/pro`, as it does image-to-video.
export interface FalRunLightricksLtx2p5TextToVideoNamespace {
  pro: FalLightricksLtx2p5TextToVideoProFn;
  fast: FalLightricksLtx2p5TextToVideoFastFn;
}

// The input audio sets the output's length: upstream takes 2 to 20
// seconds of audio on the fast tier.
type FalLightricksLtx2p5AudioToVideoFastFn = ((
  params: FalLightricksLtx2p5AudioToVideoFastRequest,
  signal?: AbortSignal
) => Promise<FalLightricksLtx2p5AudioToVideoFastResponse>) & {
  schema: ApicitySchema<FalLightricksLtx2p5AudioToVideoFastRequest>;
};

// The input audio sets the output's length: upstream takes 2 to 10
// seconds of audio on the pro tier.
type FalLightricksLtx2p5AudioToVideoProFn = ((
  params: FalLightricksLtx2p5AudioToVideoProRequest,
  signal?: AbortSignal
) => Promise<FalLightricksLtx2p5AudioToVideoProResponse>) & {
  schema: ApicitySchema<FalLightricksLtx2p5AudioToVideoProRequest>;
};

// `pro` is a URL segment, not a variant flag: upstream serves LTX-2.5
// audio-to-video at `/pro` and `/fast`, as it does text-to-video and
// image-to-video.
export interface FalRunLightricksLtx2p5AudioToVideoNamespace {
  fast: FalLightricksLtx2p5AudioToVideoFastFn;
  pro: FalLightricksLtx2p5AudioToVideoProFn;
}

export interface FalRunLightricksLtx2p5Namespace {
  audioToVideo: FalRunLightricksLtx2p5AudioToVideoNamespace;
  textToVideo: FalRunLightricksLtx2p5TextToVideoNamespace;
  imageToVideo: FalRunLightricksLtx2p5ImageToVideoNamespace;
}

export interface FalRunLightricksNamespace {
  ltx2p5: FalRunLightricksLtx2p5Namespace;
}

export interface FalRunNamespace {
  bria: FalRunBriaNamespace;

  recraft: FalRunRecraftNamespace;

  tripo3d: FalRunTripo3dNamespace;

  google: FalRunGoogleNamespace;

  elevenlabs: FalRunElevenlabsFrontierNamespace;

  ideogram: FalRunIdeogramNamespace;
  alibaba: FalRunAlibabaNamespace;
  blackforestlabs: FalRunBlackforestlabsNamespace;
  bytedance: FalRunBytedanceNamespace;
  hunyuan: FalRunHunyuanNamespace;
  klingVideo: FalRunKlingVideoNamespace;
  minimax: FalRunMinimaxNamespace;
  meshy: FalRunMeshyNamespace;
  lightricks: FalRunLightricksNamespace;
  nanoBanana: FalRunNanoBananaNamespace;
  nanoBananaPro: FalRunNanoBananaProNamespace;
  nanoBanana2: FalRunNanoBanana2Namespace;
  nanoBanana2Lite: FalRunNanoBanana2LiteNamespace;
  virtualTryOn: FalVirtualTryOnFn;
  topaz: FalRunTopazNamespace;
  geminiOmniFlash: FalGeminiOmniFlashFn;
  qwenImage: FalQwenImageFn;
  gptImage1p5: FalGptImage1p5Fn;
  sora2: FalRunSora2Namespace;
  veo3p1: FalRunVeo3p1Namespace;
  falAi: FalRunFalAiNamespace;
  wan: FalRunWanNamespace;
  xai: FalRunXaiNamespace;
}

// ==================== fal.run fal-ai namespace ====================

type FalElevenlabsSpeechToTextScribeV2Fn = ((
  params: FalElevenlabsSpeechToTextScribeV2Request,
  signal?: AbortSignal
) => Promise<FalElevenlabsSpeechToTextScribeV2Response>) & {
  schema: ApicitySchema<FalElevenlabsSpeechToTextScribeV2Request>;
};

export interface FalRunElevenlabsSpeechToTextNamespace {
  scribeV2: FalElevenlabsSpeechToTextScribeV2Fn;
}

export interface FalRunElevenlabsNamespace {
  speechToText: FalRunElevenlabsSpeechToTextNamespace;
}

export interface FalRunFalAiNamespace {
  elevenlabs: FalRunElevenlabsNamespace;
}

// ==================== Verb-Prefixed API Surface ====================

// GET v1 namespace
interface FalGetV1ModelsNamespace {
  (
    params?: FalModelSearchParams,
    signal?: AbortSignal
  ): Promise<FalModelSearchResponse>;
  pricing: FalGetV1ModelsPricingNamespace;
  usage(
    params?: FalUsageParams,
    signal?: AbortSignal
  ): Promise<FalUsageResponse>;
  analytics(
    params: FalAnalyticsParams,
    signal?: AbortSignal
  ): Promise<FalAnalyticsResponse>;
  requests: FalModelsRequestsNamespace;
}

interface FalGetV1QueueNamespace {
  status(
    params: FalQueueStatusParams,
    signal?: AbortSignal
  ): Promise<FalQueueStatusResponse>;
  result(
    params: FalQueueResultParams,
    signal?: AbortSignal
  ): Promise<FalQueueResultResponse>;
}

interface FalGetV1ServerlessFilesNamespace {
  list(
    params?: FalFilesListParams,
    signal?: AbortSignal
  ): Promise<FalFileItem[]>;
}

interface FalGetV1ServerlessAppsNamespace {
  queue(
    params: FalAppsQueueParams,
    signal?: AbortSignal
  ): Promise<FalAppsQueueResponse>;
}

interface FalGetV1ServerlessNamespace {
  files: FalGetV1ServerlessFilesNamespace;
  apps: FalGetV1ServerlessAppsNamespace;
  metrics(signal?: AbortSignal): Promise<string>;
}

interface FalGetV1WorkflowsNamespace {
  (
    params?: FalWorkflowListParams,
    signal?: AbortSignal
  ): Promise<FalWorkflowListResponse>;
  get(
    params: FalWorkflowGetParams,
    signal?: AbortSignal
  ): Promise<FalWorkflowGetResponse>;
}

interface FalGetV1Namespace {
  models: FalGetV1ModelsNamespace;
  queue: FalGetV1QueueNamespace;
  serverless: FalGetV1ServerlessNamespace;
  workflows: FalGetV1WorkflowsNamespace;
}

// POST v1 namespace
interface FalPostV1ModelsPricingNamespace {
  estimate: FalPricingEstimateMethod;
}

interface FalPostV1ModelsNamespace {
  pricing: FalPostV1ModelsPricingNamespace;
}

interface FalPostV1QueueNamespace {
  submit: FalQueueSubmitMethod;
}

interface FalPostV1ServerlessFilesNamespace {
  uploadUrl: FalFilesUploadUrlMethod;
  uploadLocal: FalFilesUploadLocalMethod;
}

interface FalPostV1ServerlessNamespace {
  files: FalPostV1ServerlessFilesNamespace;
}

interface FalPostV1Namespace {
  models: FalPostV1ModelsNamespace;
  queue: FalPostV1QueueNamespace;
  serverless: FalPostV1ServerlessNamespace;
}

// POST stream v1 namespace
interface FalPostStreamV1ServerlessLogsNamespace {
  stream: FalLogsStreamMethod;
}

interface FalPostStreamV1ServerlessNamespace {
  logs: FalPostStreamV1ServerlessLogsNamespace;
}

interface FalPostStreamV1Namespace {
  serverless: FalPostStreamV1ServerlessNamespace;
}

interface FalPostStreamNamespace {
  v1: FalPostStreamV1Namespace;
}

// DELETE v1 namespace
interface FalDeleteV1ModelsRequestsNamespace {
  payloads: FalDeletePayloadsMethod;
}

interface FalDeleteV1ModelsNamespace {
  requests: FalDeleteV1ModelsRequestsNamespace;
}

interface FalDeleteV1Namespace {
  models: FalDeleteV1ModelsNamespace;
}

// Verb-prefixed root namespaces
interface FalGetNamespace {
  v1: FalGetV1Namespace;
}

interface FalPostNamespace {
  v1: FalPostV1Namespace;
  run: FalRunNamespace;
  stream: FalPostStreamNamespace;
}

interface FalDeleteNamespace {
  v1: FalDeleteV1Namespace;
}

// Storage upload (CDN)

export interface FalStorageLifecycle {
  expiration_duration_seconds: number;
  allow_io_storage?: boolean;
}

export interface FalStorageUploadInitiateResponse {
  file_url: string;
  upload_url: string;
}

export interface FalStorageUploadPartResponse {
  partNumber: number;
  etag: string;
}

type FalStorageUploadInitiateFn = ((
  params: FalStorageUploadInitiateParams,
  signal?: AbortSignal
) => Promise<FalStorageUploadInitiateResponse>) & {
  schema: ApicitySchema<FalStorageUploadInitiateParams>;
};

type FalStorageUploadInitiateMultipartFn = ((
  params: FalStorageUploadInitiateMultipartParams,
  signal?: AbortSignal
) => Promise<FalStorageUploadInitiateResponse>) & {
  schema: ApicitySchema<FalStorageUploadInitiateMultipartParams>;
};

type FalStorageUploadCompleteMultipartFn = ((
  params: FalStorageUploadCompleteMultipartParams,
  signal?: AbortSignal
) => Promise<Response>) & {
  schema: ApicitySchema<FalStorageUploadCompleteMultipartParams>;
};

export interface FalStorageUploadNamespace {
  initiate: FalStorageUploadInitiateFn;
  initiateMultipart: FalStorageUploadInitiateMultipartFn;
  completeMultipart: FalStorageUploadCompleteMultipartFn;
}

export interface FalStorageNamespace {
  upload: FalStorageUploadNamespace;
}

// Provider interface
export interface FalProvider {
  v1: FalV1Namespace;
  run: FalRunNamespace;
  storage: FalStorageNamespace;
  get: FalGetNamespace;
  post: FalPostNamespace;
  delete: FalDeleteNamespace;
}

export interface FalMinimaxH3MaxTurboExtendVideoResponse {
  video: {
    url: string;
    content_type?: string | null;
    file_name?: string | null;
    file_size?: number | null;
  };
  duration: number;
  seed: number;
  source: Record<string, unknown>;
  expanded_prompt?: string | null;
  timings?: Record<string, number>;
}
export interface FalRunMinimaxH3MaxTurboNamespace {
  textToVideo: ((
    params: FalMinimaxH3MaxTurboTextToVideoRequest,
    signal?: AbortSignal
  ) => Promise<FalMinimaxH3MaxTurboTextToVideoResponse>) & {
    schema: ApicitySchema<FalMinimaxH3MaxTurboTextToVideoRequest>;
  };

  imageToVideo: ((
    params: FalMinimaxH3MaxTurboImageToVideoRequest,
    signal?: AbortSignal
  ) => Promise<FalMinimaxH3MaxTurboImageToVideoResponse>) & {
    schema: ApicitySchema<FalMinimaxH3MaxTurboImageToVideoRequest>;
  };

  extendVideo: ((
    params: FalMinimaxH3MaxTurboExtendVideoRequest,
    signal?: AbortSignal
  ) => Promise<FalMinimaxH3MaxTurboExtendVideoResponse>) & {
    schema: ApicitySchema<FalMinimaxH3MaxTurboExtendVideoRequest>;
  };
}
export interface FalRunMinimaxNamespace {
  h3MaxTurbo: FalRunMinimaxH3MaxTurboNamespace;
}

export interface FalXaiGrokImagineVideoV1p5LiteTextToVideoResponse {
  video: {
    url: string;
    content_type?: string | null;
    file_name?: string | null;
    file_size?: number | null;
    width?: number | null;
    height?: number | null;
    fps?: number | null;
    duration?: number | null;
    num_frames?: number | null;
  };
}
export interface FalRunXaiGrokImagineVideoV1p5LiteNamespace {
  imageToVideo: ((
    params: FalXaiGrokImagineVideoV1p5LiteImageToVideoRequest,
    signal?: AbortSignal
  ) => Promise<FalXaiGrokImagineVideoV1p5LiteImageToVideoResponse>) & {
    schema: ApicitySchema<FalXaiGrokImagineVideoV1p5LiteImageToVideoRequest>;
  };
  textToVideo: ((
    params: FalXaiGrokImagineVideoV1p5LiteTextToVideoRequest,
    signal?: AbortSignal
  ) => Promise<FalXaiGrokImagineVideoV1p5LiteTextToVideoResponse>) & {
    schema: ApicitySchema<FalXaiGrokImagineVideoV1p5LiteTextToVideoRequest>;
  };
}
export interface FalRunXaiGrokImagineVideoV1p5Namespace {
  lite: FalRunXaiGrokImagineVideoV1p5LiteNamespace;
}

export interface FalMinimaxH3MaxRecastResponse {
  video: {
    url: string;
    content_type?: string | null;
    file_name?: string | null;
    file_size?: number | null;
  };
  seed: number;
}
export interface FalRunMinimaxH3MaxLipSyncNamespace {
  imageToVideo: ((
    params: FalMinimaxH3MaxLipSyncImageToVideoRequest,
    signal?: AbortSignal
  ) => Promise<FalMinimaxH3MaxLipSyncImageToVideoResponse>) & {
    schema: ApicitySchema<FalMinimaxH3MaxLipSyncImageToVideoRequest>;
  };
}
export interface FalRunMinimaxH3MaxNamespace {
  lipSync: FalRunMinimaxH3MaxLipSyncNamespace;

  threeDToVideo: ((
    params: FalMinimaxH3MaxThreeDToVideoRequest,
    signal?: AbortSignal
  ) => Promise<FalMinimaxH3MaxThreeDToVideoResponse>) & {
    schema: ApicitySchema<FalMinimaxH3MaxThreeDToVideoRequest>;
  };

  referenceToVideo: ((
    params: FalMinimaxH3MaxReferenceToVideoRequest,
    signal?: AbortSignal
  ) => Promise<FalMinimaxH3MaxReferenceToVideoResponse>) & {
    schema: ApicitySchema<FalMinimaxH3MaxReferenceToVideoRequest>;
  };

  cameraControls: ((
    params: FalMinimaxH3MaxCameraControlsRequest,
    signal?: AbortSignal
  ) => Promise<FalMinimaxH3MaxCameraControlsResponse>) & {
    schema: ApicitySchema<FalMinimaxH3MaxCameraControlsRequest>;
  };

  textToVideo: ((
    params: FalMinimaxH3MaxTextToVideoRequest,
    signal?: AbortSignal
  ) => Promise<FalMinimaxH3MaxTextToVideoResponse>) & {
    schema: ApicitySchema<FalMinimaxH3MaxTextToVideoRequest>;
  };

  imageToVideo: ((
    params: FalMinimaxH3MaxImageToVideoRequest,
    signal?: AbortSignal
  ) => Promise<FalMinimaxH3MaxImageToVideoResponse>) & {
    schema: ApicitySchema<FalMinimaxH3MaxImageToVideoRequest>;
  };

  extendVideo: ((
    params: FalMinimaxH3MaxExtendVideoRequest,
    signal?: AbortSignal
  ) => Promise<FalMinimaxH3MaxExtendVideoResponse>) & {
    schema: ApicitySchema<FalMinimaxH3MaxExtendVideoRequest>;
  };

  insertVideo: ((
    params: FalMinimaxH3MaxInsertVideoRequest,
    signal?: AbortSignal
  ) => Promise<FalMinimaxH3MaxInsertVideoResponse>) & {
    schema: ApicitySchema<FalMinimaxH3MaxInsertVideoRequest>;
  };

  recast: ((
    params: FalMinimaxH3MaxRecastRequest,
    signal?: AbortSignal
  ) => Promise<FalMinimaxH3MaxRecastResponse>) & {
    schema: ApicitySchema<FalMinimaxH3MaxRecastRequest>;
  };
}
export interface FalRunMinimaxNamespace {
  h3Max: FalRunMinimaxH3MaxNamespace;
}

export interface FalFlux3EditImageResponse {
  images: Array<{
    url: string;
    content_type?: string | null;
    file_name?: string | null;
    file_size?: number | null;
    width?: number | null;
    height?: number | null;
  }>;
}
export interface FalRunFlux3Namespace {
  editImage: ((
    params: FalFlux3EditImageRequest,
    signal?: AbortSignal
  ) => Promise<FalFlux3EditImageResponse>) & {
    schema: ApicitySchema<FalFlux3EditImageRequest>;
  };
}

export interface FalFlux3TextToImageResponse {
  images: Array<{
    url: string;
    content_type?: string | null;
    file_name?: string | null;
    file_size?: number | null;
    width?: number | null;
    height?: number | null;
  }>;
}
export interface FalRunFlux3Namespace {
  textToImage: ((
    params: FalFlux3TextToImageRequest,
    signal?: AbortSignal
  ) => Promise<FalFlux3TextToImageResponse>) & {
    schema: ApicitySchema<FalFlux3TextToImageRequest>;
  };
}

export interface FalXaiGrokImagineVideoV1p5LiteImageToVideoResponse {
  video: {
    url: string;
    content_type?: string | null;
    file_name?: string | null;
    file_size?: number | null;
    width?: number | null;
    height?: number | null;
    fps?: number | null;
    duration?: number | null;
    num_frames?: number | null;
  };
}

export interface FalIdeogramV4p5EditResponse {
  images: {
    url: string;
    content_type?: string | null;
    file_name?: string | null;
    file_size?: number | null;
  }[];
  seed: number;
}
export interface FalRunIdeogramV4p5Namespace {
  (
    params: FalIdeogramV4p5Request,
    signal?: AbortSignal
  ): Promise<FalIdeogramV4p5Response>;
  schema: ApicitySchema<FalIdeogramV4p5Request>;

  edit: ((
    params: FalIdeogramV4p5EditRequest,
    signal?: AbortSignal
  ) => Promise<FalIdeogramV4p5EditResponse>) & {
    schema: ApicitySchema<FalIdeogramV4p5EditRequest>;
  };
}
export interface FalRunIdeogramNamespace {
  v4p5: FalRunIdeogramV4p5Namespace;
}

export interface FalIdeogramV4p5Response {
  seed: number;
  images: {
    content_type?: string | null;
    file_name?: string | null;
    file_size?: number | null;
    url: string;
  }[];
}

export interface FalMinimaxH3MaxInsertVideoResponse {
  frame_count: number;
  resume_time: number;
  start_time: number;
  video: {
    url: string;
    num_frames?: number | null;
    file_size?: number | null;
    content_type?: string | null;
    height?: number | null;
    width?: number | null;
    file_name?: string | null;
    duration?: number | null;
    fps?: number | null;
  };
  expanded_prompt?: string | null;
  injected_duration: number;
  height: number;
  seed: number;
  width: number;
  source: Record<string, unknown>;
  duration: number;
  timings: Record<string, number>;
}

export interface FalElevenlabsTtsElevenV4TurboResponse {
  timestamps?: unknown[] | null;
  audio: {
    content_type?: string | null;
    url: string;
    file_size?: number | null;
    file_name?: string | null;
  };
}

export interface FalRunElevenlabsTtsNamespace {
  elevenV4: ((
    params: FalElevenlabsTtsElevenV4Request,
    signal?: AbortSignal
  ) => Promise<FalElevenlabsTtsElevenV4Response>) & {
    schema: ApicitySchema<FalElevenlabsTtsElevenV4Request>;
  };

  elevenV4Turbo: ((
    params: FalElevenlabsTtsElevenV4TurboRequest,
    signal?: AbortSignal
  ) => Promise<FalElevenlabsTtsElevenV4TurboResponse>) & {
    schema: ApicitySchema<FalElevenlabsTtsElevenV4TurboRequest>;
  };
}

export interface FalRunElevenlabsFrontierNamespace {
  tts: FalRunElevenlabsTtsNamespace;
}

export interface FalElevenlabsTtsElevenV4Response {
  timestamps?: unknown[] | null;
  audio: {
    content_type?: string | null;
    url: string;
    file_size?: number | null;
    file_name?: string | null;
  };
}

export interface FalGoogleGemini3p8FlashTtsResponse {
  audio: {
    file_size?: number | null;
    content_type?: string | null;
    url: string;
    file_name?: string | null;
  };
}

export interface FalRunGoogleNamespace {
  lyria3p5: ((
    params: FalGoogleLyria3p5Request,
    signal?: AbortSignal
  ) => Promise<FalGoogleLyria3p5Response>) & {
    schema: ApicitySchema<FalGoogleLyria3p5Request>;
  };

  gemini3p8FlashLiteTts: ((
    params: FalGoogleGemini3p8FlashLiteTtsRequest,
    signal?: AbortSignal
  ) => Promise<FalGoogleGemini3p8FlashLiteTtsResponse>) & {
    schema: ApicitySchema<FalGoogleGemini3p8FlashLiteTtsRequest>;
  };

  gemini3p8FlashTts: ((
    params: FalGoogleGemini3p8FlashTtsRequest,
    signal?: AbortSignal
  ) => Promise<FalGoogleGemini3p8FlashTtsResponse>) & {
    schema: ApicitySchema<FalGoogleGemini3p8FlashTtsRequest>;
  };
}

export interface FalGoogleGemini3p8FlashLiteTtsResponse {
  audio: {
    file_size?: number | null;
    content_type?: string | null;
    url: string;
    file_name?: string | null;
  };
}

export interface FalBytedanceSeedreamV5FlashLayerizeResponse {
  layers: {
    description?: string | null;
    image: {
      content_type?: string | null;
      file_name?: string | null;
      file_size?: number | null;
      url: string;
      width?: number | null;
      height?: number | null;
    };
    z_index: number;
    name?: string | null;
    bounding_box?: unknown | null;
  }[];
  images: {
    content_type?: string | null;
    file_name?: string | null;
    file_size?: number | null;
    url: string;
    width?: number | null;
    height?: number | null;
  }[];
}

export interface FalRunBytedanceSeedreamV5FlashNamespace {
  textToImage: ((
    params: FalBytedanceSeedreamV5FlashTextToImageRequest,
    signal?: AbortSignal
  ) => Promise<FalBytedanceSeedreamV5FlashTextToImageResponse>) & {
    schema: ApicitySchema<FalBytedanceSeedreamV5FlashTextToImageRequest>;
  };

  edit: ((
    params: FalBytedanceSeedreamV5FlashEditRequest,
    signal?: AbortSignal
  ) => Promise<FalBytedanceSeedreamV5FlashEditResponse>) & {
    schema: ApicitySchema<FalBytedanceSeedreamV5FlashEditRequest>;
  };

  layerize: ((
    params: FalBytedanceSeedreamV5FlashLayerizeRequest,
    signal?: AbortSignal
  ) => Promise<FalBytedanceSeedreamV5FlashLayerizeResponse>) & {
    schema: ApicitySchema<FalBytedanceSeedreamV5FlashLayerizeRequest>;
  };
}

export interface FalBytedanceSeedreamV5FlashEditResponse {
  images: {
    content_type?: string | null;
    file_name?: string | null;
    file_size?: number | null;
    url: string;
    width?: number | null;
    height?: number | null;
  }[];
}

export interface FalBytedanceSeedreamV5FlashTextToImageResponse {
  images: {
    content_type?: string | null;
    file_name?: string | null;
    file_size?: number | null;
    url: string;
    width?: number | null;
    height?: number | null;
  }[];
}

export interface FalTripo3dP2TextTo3dResponse {
  model_mesh: {
    file_size?: number | null;
    content_type?: string | null;
    url: string;
    file_name?: string | null;
  };
  task_id?: string | null;
  rendered_image?: FalFile | null;
  model_urls: {
    pbr_model?: FalFile | null;
    base_model?: FalFile | null;
    glb?: FalFile | null;
    fbx?: FalFile | null;
  };
}

export interface FalRunTripo3dP2Namespace {
  imageTo3d: ((
    params: FalTripo3dP2ImageTo3dRequest,
    signal?: AbortSignal
  ) => Promise<FalTripo3dP2ImageTo3dResponse>) & {
    schema: ApicitySchema<FalTripo3dP2ImageTo3dRequest>;
  };

  textTo3d: ((
    params: FalTripo3dP2TextTo3dRequest,
    signal?: AbortSignal
  ) => Promise<FalTripo3dP2TextTo3dResponse>) & {
    schema: ApicitySchema<FalTripo3dP2TextTo3dRequest>;
  };
}

export interface FalRunTripo3dNamespace {
  p2: FalRunTripo3dP2Namespace;
}

export interface FalTripo3dP2ImageTo3dResponse {
  model_mesh: {
    file_size?: number | null;
    content_type?: string | null;
    url: string;
    file_name?: string | null;
  };
  task_id?: string | null;
  rendered_image?: FalFile | null;
  model_urls: {
    pbr_model?: FalFile | null;
    base_model?: FalFile | null;
    glb?: FalFile | null;
    fbx?: FalFile | null;
  };
}

export interface FalRecraftV4p1FlashTextToImageResponse {
  images: {
    content_type?: string | null;
    url: string;
    file_size?: number | null;
    file_name?: string | null;
  }[];
}

export interface FalRunRecraftV4p1FlashNamespace {
  textToImage: ((
    params: FalRecraftV4p1FlashTextToImageRequest,
    signal?: AbortSignal
  ) => Promise<FalRecraftV4p1FlashTextToImageResponse>) & {
    schema: ApicitySchema<FalRecraftV4p1FlashTextToImageRequest>;
  };
}

export interface FalRunRecraftV4p1Namespace {
  flash: FalRunRecraftV4p1FlashNamespace;
}

export interface FalRunRecraftNamespace {
  v4p1: FalRunRecraftV4p1Namespace;
}

export interface FalMeshyV7p1TextTo3dResponse {
  thumbnail?: unknown | null;
  basic_animations?: unknown | null;
  rigged_character_fbx?: unknown | null;
  animation_glb?: unknown | null;
  rig_task_id?: string | null;
  animation_fbx?: unknown | null;
  prompt: string;
  seed?: number | null;
  rigged_character_glb?: unknown | null;
  texture_urls?: {
    normal?: unknown | null;
    metallic?: unknown | null;
    roughness?: unknown | null;
    base_color: {
      content_type?: string | null;
      file_name?: string | null;
      file_size?: number | null;
      url: string;
    };
  }[];
  model_glb: {
    content_type?: string | null;
    file_name?: string | null;
    file_size?: number | null;
    url: string;
  };
  model_urls: {
    fbx?: unknown | null;
    obj?: unknown | null;
    usdz?: unknown | null;
    glb?: unknown | null;
    blend?: unknown | null;
    stl?: unknown | null;
  };
  actual_prompt?: string | null;
}

export interface FalRunMeshyV7p1Namespace {
  multiImageTo3d: ((
    params: FalMeshyV7p1MultiImageTo3dRequest,
    signal?: AbortSignal
  ) => Promise<FalMeshyV7p1MultiImageTo3dResponse>) & {
    schema: ApicitySchema<FalMeshyV7p1MultiImageTo3dRequest>;
  };

  imageTo3d: ((
    params: FalMeshyV7p1ImageTo3dRequest,
    signal?: AbortSignal
  ) => Promise<FalMeshyV7p1ImageTo3dResponse>) & {
    schema: ApicitySchema<FalMeshyV7p1ImageTo3dRequest>;
  };

  textTo3d: ((
    params: FalMeshyV7p1TextTo3dRequest,
    signal?: AbortSignal
  ) => Promise<FalMeshyV7p1TextTo3dResponse>) & {
    schema: ApicitySchema<FalMeshyV7p1TextTo3dRequest>;
  };
}

export interface FalMeshyV7p1ImageTo3dResponse {
  thumbnail?: unknown | null;
  basic_animations?: unknown | null;
  rigged_character_fbx?: unknown | null;
  animation_glb?: unknown | null;
  rig_task_id?: string | null;
  animation_fbx?: unknown | null;
  seed?: number | null;
  rigged_character_glb?: unknown | null;
  texture_urls?: {
    normal?: unknown | null;
    metallic?: unknown | null;
    roughness?: unknown | null;
    base_color: {
      content_type?: string | null;
      file_name?: string | null;
      file_size?: number | null;
      url: string;
    };
  }[];
  model_glb: {
    content_type?: string | null;
    file_name?: string | null;
    file_size?: number | null;
    url: string;
  };
  model_urls: {
    fbx?: unknown | null;
    obj?: unknown | null;
    usdz?: unknown | null;
    glb?: unknown | null;
    blend?: unknown | null;
    stl?: unknown | null;
  };
}

export interface FalMeshyV7p1MultiImageTo3dResponse {
  thumbnail?: unknown | null;
  basic_animations?: unknown | null;
  rigged_character_fbx?: unknown | null;
  animation_glb?: unknown | null;
  rig_task_id?: string | null;
  animation_fbx?: unknown | null;
  seed?: number | null;
  rigged_character_glb?: unknown | null;
  texture_urls?: {
    normal?: unknown | null;
    metallic?: unknown | null;
    roughness?: unknown | null;
    base_color: {
      content_type?: string | null;
      file_name?: string | null;
      file_size?: number | null;
      url: string;
    };
  }[];
  model_glb: {
    content_type?: string | null;
    file_name?: string | null;
    file_size?: number | null;
    url: string;
  };
  model_urls: {
    fbx?: unknown | null;
    obj?: unknown | null;
    usdz?: unknown | null;
    glb?: unknown | null;
    blend?: unknown | null;
    stl?: unknown | null;
  };
}

export interface FalGoogleLyria3p5Response {
  lyrics?: string | null;
  audio: {
    content_type?: string | null;
    url: string;
    file_size?: number | null;
    file_name?: string | null;
  };
}

export interface FalBriaFiboEdit1p5VirtualTryOnResponse {
  structured_instruction: Record<string, unknown>;
  images?: {
    width?: number | null;
    height?: number | null;
    content_type?: string | null;
    file_size?: number | null;
    url: string;
    file_name?: string | null;
  }[];
  image: {
    width?: number | null;
    height?: number | null;
    content_type?: string | null;
    file_size?: number | null;
    url: string;
    file_name?: string | null;
  };
}

export interface FalRunBriaFiboEdit1p5Namespace {
  productHolding: ((
    params: FalBriaFiboEdit1p5ProductHoldingRequest,
    signal?: AbortSignal
  ) => Promise<FalBriaFiboEdit1p5ProductHoldingResponse>) & {
    schema: ApicitySchema<FalBriaFiboEdit1p5ProductHoldingRequest>;
  };

  virtualTryOn: ((
    params: FalBriaFiboEdit1p5VirtualTryOnRequest,
    signal?: AbortSignal
  ) => Promise<FalBriaFiboEdit1p5VirtualTryOnResponse>) & {
    schema: ApicitySchema<FalBriaFiboEdit1p5VirtualTryOnRequest>;
  };
}

export interface FalRunBriaNamespace {
  fiboEdit1p5: FalRunBriaFiboEdit1p5Namespace;
}

export interface FalBriaFiboEdit1p5ProductHoldingResponse {
  structured_instruction: Record<string, unknown>;
  images?: {
    width?: number | null;
    height?: number | null;
    content_type?: string | null;
    file_size?: number | null;
    url: string;
    file_name?: string | null;
  }[];
  image: {
    width?: number | null;
    height?: number | null;
    content_type?: string | null;
    file_size?: number | null;
    url: string;
    file_name?: string | null;
  };
}

export interface FalMinimaxH3MaxExtendVideoResponse {
  video: {
    url: string;
    content_type?: string | null;
    file_name?: string | null;
    file_size?: number | null;
  };
  duration: number;
  seed: number;
  source: Record<string, unknown>;
  expanded_prompt?: string | null;
  timings?: Record<string, number>;
}

export interface FalMinimaxH3MaxImageToVideoResponse {
  video: {
    url: string;
    content_type?: string | null;
    file_name?: string | null;
    file_size?: number | null;
  };
  expanded_prompt?: string | null;
  timings?: Record<string, number> | null;
}

export interface FalMinimaxH3MaxTextToVideoResponse {
  video: {
    url: string;
    content_type?: string | null;
    file_name?: string | null;
    file_size?: number | null;
  };
  expanded_prompt?: string | null;
  timings?: Record<string, number> | null;
}

export interface FalMinimaxH3MaxCameraControlsResponse {
  video: {
    url: string;
    content_type?: string | null;
    file_name?: string | null;
    file_size?: number | null;
  };
  expanded_prompt?: string | null;
  timings?: Record<string, number> | null;
}

export interface FalMinimaxH3MaxReferenceToVideoResponse {
  video: {
    url: string;
    content_type?: string | null;
    file_name?: string | null;
    file_size?: number | null;
  };
  expanded_prompt?: string | null;
  seed: number;
  timings?: Record<string, number> | null;
}

export interface FalMinimaxH3MaxThreeDToVideoResponse {
  video: {
    url: string;
    content_type?: string | null;
    file_name?: string | null;
    file_size?: number | null;
  };
}

export interface FalMinimaxH3MaxLipSyncImageToVideoResponse {
  video: {
    url: string;
    content_type?: string | null;
    file_name?: string | null;
    file_size?: number | null;
  };
  seed: number;
  duration: number;
  timings?: Record<string, number> | null;
}

export interface FalMinimaxH3MaxTurboImageToVideoResponse {
  video: {
    url: string;
    content_type?: string | null;
    file_name?: string | null;
    file_size?: number | null;
  };
  expanded_prompt?: string | null;
  timings?: Record<string, number> | null;
}

export interface FalMinimaxH3MaxTurboTextToVideoResponse {
  video: {
    url: string;
    content_type?: string | null;
    file_name?: string | null;
    file_size?: number | null;
  };
  expanded_prompt?: string | null;
  timings?: Record<string, number> | null;
}

export interface FalXaiGrokImagineVideoV1p5TextToVideoResponse {
  video: {
    url: string;
    content_type?: string | null;
    file_name?: string | null;
    file_size?: number | null;
    width?: number | null;
    height?: number | null;
    fps?: number | null;
    duration?: number | null;
    num_frames?: number | null;
  };
}

export interface FalXaiGrokImagineVideoV1p5ImageToVideoResponse {
  video: {
    url: string;
    content_type?: string | null;
    file_name?: string | null;
    file_size?: number | null;
    width?: number | null;
    height?: number | null;
    fps?: number | null;
    duration?: number | null;
    num_frames?: number | null;
  };
}

export interface FalGeminiOmniFlashV1p1EditResponse {
  video: {
    url: string;
    content_type?: string | null;
    file_name?: string | null;
    file_size?: number | null;
  };
}

export interface FalGeminiOmniFlashV1p1ReferenceToVideoResponse {
  video: {
    url: string;
    content_type?: string | null;
    file_name?: string | null;
    file_size?: number | null;
  };
}

export interface FalGeminiOmniFlashV1p1ImageToVideoResponse {
  video: {
    url: string;
    content_type?: string | null;
    file_name?: string | null;
    file_size?: number | null;
  };
}

export interface FalGeminiOmniFlashV1p1TextToVideoResponse {
  video: {
    url: string;
    content_type?: string | null;
    file_name?: string | null;
    file_size?: number | null;
  };
}

export interface FalLightricksLtx2p5TextToVideoFastResponse {
  video: {
    url: string;
    content_type?: string | null;
    file_name?: string | null;
    file_size?: number | null;
    width?: number | null;
    height?: number | null;
    fps?: number | null;
    duration?: number | null;
    num_frames?: number | null;
  };
}

export interface FalLightricksLtx2p5TextToVideoProResponse {
  video: {
    url: string;
    content_type?: string | null;
    file_name?: string | null;
    file_size?: number | null;
    width?: number | null;
    height?: number | null;
    fps?: number | null;
    duration?: number | null;
    num_frames?: number | null;
  };
}

export interface FalLightricksLtx2p5AudioToVideoProResponse {
  video: {
    url: string;
    content_type?: string | null;
    file_name?: string | null;
    file_size?: number | null;
    width?: number | null;
    height?: number | null;
    fps?: number | null;
    duration?: number | null;
    num_frames?: number | null;
  };
}

export interface FalLightricksLtx2p5AudioToVideoFastResponse {
  video: {
    url: string;
    content_type?: string | null;
    file_name?: string | null;
    file_size?: number | null;
    width?: number | null;
    height?: number | null;
    fps?: number | null;
    duration?: number | null;
    num_frames?: number | null;
  };
}

export interface FalKlingVideoV3TurboStandardTextToVideoResponse {
  video: {
    url: string;
    content_type?: string | null;
    file_name?: string | null;
    file_size?: number | null;
  };
}

type FalKlingVideoV3TurboStandardTextToVideoFn = ((
  params: FalKlingVideoV3TurboStandardTextToVideoRequest,
  signal?: AbortSignal
) => Promise<FalKlingVideoV3TurboStandardTextToVideoResponse>) & {
  schema: ApicitySchema<FalKlingVideoV3TurboStandardTextToVideoRequest>;
};

export interface FalRunKlingVideoV3TurboStandardNamespace {
  textToVideo: FalKlingVideoV3TurboStandardTextToVideoFn;
}

export interface FalRunKlingVideoV3TurboNamespace {
  standard: FalRunKlingVideoV3TurboStandardNamespace;
}

export interface FalRunKlingVideoV3Namespace {
  turbo: FalRunKlingVideoV3TurboNamespace;
}

export interface FalKlingVideoV3TurboStandardImageToVideoResponse {
  video: {
    url: string;
    content_type?: string | null;
    file_name?: string | null;
    file_size?: number | null;
  };
}

type FalKlingVideoV3TurboStandardImageToVideoFn = ((
  params: FalKlingVideoV3TurboStandardImageToVideoRequest,
  signal?: AbortSignal
) => Promise<FalKlingVideoV3TurboStandardImageToVideoResponse>) & {
  schema: ApicitySchema<FalKlingVideoV3TurboStandardImageToVideoRequest>;
};

export interface FalRunKlingVideoV3TurboStandardNamespace {
  imageToVideo: FalKlingVideoV3TurboStandardImageToVideoFn;
}

export interface FalKlingVideoV3TurboProTextToVideoResponse {
  video: {
    url: string;
    content_type?: string | null;
    file_name?: string | null;
    file_size?: number | null;
  };
}

type FalKlingVideoV3TurboProTextToVideoFn = ((
  params: FalKlingVideoV3TurboProTextToVideoRequest,
  signal?: AbortSignal
) => Promise<FalKlingVideoV3TurboProTextToVideoResponse>) & {
  schema: ApicitySchema<FalKlingVideoV3TurboProTextToVideoRequest>;
};

export interface FalRunKlingVideoV3TurboProNamespace {
  textToVideo: FalKlingVideoV3TurboProTextToVideoFn;
}

export interface FalRunKlingVideoV3TurboNamespace {
  pro: FalRunKlingVideoV3TurboProNamespace;
}

export interface FalKlingVideoV3TurboProImageToVideoResponse {
  video: {
    url: string;
    content_type?: string | null;
    file_name?: string | null;
    file_size?: number | null;
  };
}

type FalKlingVideoV3TurboProImageToVideoFn = ((
  params: FalKlingVideoV3TurboProImageToVideoRequest,
  signal?: AbortSignal
) => Promise<FalKlingVideoV3TurboProImageToVideoResponse>) & {
  schema: ApicitySchema<FalKlingVideoV3TurboProImageToVideoRequest>;
};

export interface FalRunKlingVideoV3TurboProNamespace {
  imageToVideo: FalKlingVideoV3TurboProImageToVideoFn;
}

export interface FalAlibabaQwenAudio3TtsResponse {
  audio: {
    url: string;
    content_type?: string | null;
    file_name?: string | null;
    file_size?: number | null;
    duration?: number | null;
    channels?: number | null;
    sample_rate?: number | null;
    bitrate?: string | number | null;
  };
}

type FalAlibabaQwenAudio3TtsFn = ((
  params: FalAlibabaQwenAudio3TtsRequest,
  signal?: AbortSignal
) => Promise<FalAlibabaQwenAudio3TtsResponse>) & {
  schema: ApicitySchema<FalAlibabaQwenAudio3TtsRequest>;
};

export interface FalRunAlibabaNamespace {
  qwenAudio3Tts: FalAlibabaQwenAudio3TtsFn;
}

export interface FalAlibabaHappyHorseV1p1ReferenceToVideoResponse {
  video: {
    url: string;
    content_type?: string | null;
    file_name?: string | null;
    file_size?: number | null;
    width?: number | null;
    height?: number | null;
    fps?: number | null;
    duration?: number | null;
    num_frames?: number | null;
  };
  seed: number;
}

type FalAlibabaHappyHorseV1p1ReferenceToVideoFn = ((
  params: FalAlibabaHappyHorseV1p1ReferenceToVideoRequest,
  signal?: AbortSignal
) => Promise<FalAlibabaHappyHorseV1p1ReferenceToVideoResponse>) & {
  schema: ApicitySchema<FalAlibabaHappyHorseV1p1ReferenceToVideoRequest>;
};

export interface FalRunAlibabaHappyHorseV1p1Namespace {
  referenceToVideo: FalAlibabaHappyHorseV1p1ReferenceToVideoFn;
}

export interface FalRunAlibabaHappyHorseNamespace {
  v1p1: FalRunAlibabaHappyHorseV1p1Namespace;
}

export interface FalRunAlibabaNamespace {
  happyHorse: FalRunAlibabaHappyHorseNamespace;
}

export interface FalAlibabaHappyHorseV1p1ImageToVideoResponse {
  video: {
    url: string;
    content_type?: string | null;
    file_name?: string | null;
    file_size?: number | null;
    width?: number | null;
    height?: number | null;
    fps?: number | null;
    duration?: number | null;
    num_frames?: number | null;
  };
  seed: number;
}

type FalAlibabaHappyHorseV1p1ImageToVideoFn = ((
  params: FalAlibabaHappyHorseV1p1ImageToVideoRequest,
  signal?: AbortSignal
) => Promise<FalAlibabaHappyHorseV1p1ImageToVideoResponse>) & {
  schema: ApicitySchema<FalAlibabaHappyHorseV1p1ImageToVideoRequest>;
};

export interface FalRunAlibabaHappyHorseV1p1Namespace {
  imageToVideo: FalAlibabaHappyHorseV1p1ImageToVideoFn;
}

export interface FalAlibabaHappyHorseV1p1TextToVideoResponse {
  video: {
    url: string;
    content_type?: string | null;
    file_name?: string | null;
    file_size?: number | null;
    width?: number | null;
    height?: number | null;
    fps?: number | null;
    duration?: number | null;
    num_frames?: number | null;
  };
  seed: number;
}

type FalAlibabaHappyHorseV1p1TextToVideoFn = ((
  params: FalAlibabaHappyHorseV1p1TextToVideoRequest,
  signal?: AbortSignal
) => Promise<FalAlibabaHappyHorseV1p1TextToVideoResponse>) & {
  schema: ApicitySchema<FalAlibabaHappyHorseV1p1TextToVideoRequest>;
};

export interface FalRunAlibabaHappyHorseV1p1Namespace {
  textToVideo: FalAlibabaHappyHorseV1p1TextToVideoFn;
}

export interface FalBlackforestlabsFlux3EditVideoResponse {
  video: {
    url: string;
    content_type?: string | null;
    file_name?: string | null;
    file_size?: number | null;
  };
  seed: number;
}

type FalBlackforestlabsFlux3EditVideoFn = ((
  params: FalBlackforestlabsFlux3EditVideoRequest,
  signal?: AbortSignal
) => Promise<FalBlackforestlabsFlux3EditVideoResponse>) & {
  schema: ApicitySchema<FalBlackforestlabsFlux3EditVideoRequest>;
};

export interface FalRunFlux3Namespace {
  editVideo: FalBlackforestlabsFlux3EditVideoFn;
}

export interface FalBriaFiboEdit1p5EditResponse {
  image: {
    url: string;
    content_type?: string | null;
    file_name?: string | null;
    file_size?: number | null;
    width?: number | null;
    height?: number | null;
  };
  images?: Array<{
    url: string;
    content_type?: string | null;
    file_name?: string | null;
    file_size?: number | null;
    width?: number | null;
    height?: number | null;
  }>;
  structured_instruction: Record<string, unknown>;
}

type FalBriaFiboEdit1p5EditFn = ((
  params: FalBriaFiboEdit1p5EditRequest,
  signal?: AbortSignal
) => Promise<FalBriaFiboEdit1p5EditResponse>) & {
  schema: ApicitySchema<FalBriaFiboEdit1p5EditRequest>;
};

export interface FalRunBriaFiboEdit1p5Namespace {
  edit: FalBriaFiboEdit1p5EditFn;
}

export interface FalBriaFiboGen1p5TextToImageResponse {
  image: {
    url: string;
    content_type?: string | null;
    file_name?: string | null;
    file_size?: number | null;
    width?: number | null;
    height?: number | null;
  };
  images?: Array<Record<string, unknown>>;
  structured_prompt: Record<string, unknown>;
}

type FalBriaFiboGen1p5TextToImageFn = ((
  params: FalBriaFiboGen1p5TextToImageRequest,
  signal?: AbortSignal
) => Promise<FalBriaFiboGen1p5TextToImageResponse>) & {
  schema: ApicitySchema<FalBriaFiboGen1p5TextToImageRequest>;
};

export interface FalRunBriaFiboGen1p5Namespace {
  textToImage: FalBriaFiboGen1p5TextToImageFn;
}

export interface FalRunBriaNamespace {
  fiboGen1p5: FalRunBriaFiboGen1p5Namespace;
}

export interface FalElevenlabsMusicV2p5Response {
  audio: {
    url: string;
    content_type?: string | null;
    file_name?: string | null;
    file_size?: number | null;
  };
}

type FalElevenlabsMusicV2p5Fn = ((
  params: FalElevenlabsMusicV2p5Request,
  signal?: AbortSignal
) => Promise<FalElevenlabsMusicV2p5Response>) & {
  schema: ApicitySchema<FalElevenlabsMusicV2p5Request>;
};

export interface FalRunElevenlabsMusicNamespace {
  v2p5: FalElevenlabsMusicV2p5Fn;
}

export interface FalRunElevenlabsFrontierNamespace {
  music: FalRunElevenlabsMusicNamespace;
}

export interface FalMetaMuseImageTextToImageResponse {
  images: Array<{
    url: string;
    content_type?: string | null;
    file_name?: string | null;
    file_size?: number | null;
    width?: number | null;
    height?: number | null;
  }>;
}

type FalMetaMuseImageTextToImageFn = ((
  params: FalMetaMuseImageTextToImageRequest,
  signal?: AbortSignal
) => Promise<FalMetaMuseImageTextToImageResponse>) & {
  schema: ApicitySchema<FalMetaMuseImageTextToImageRequest>;
};

export interface FalRunMetaMuseImageNamespace {
  textToImage: FalMetaMuseImageTextToImageFn;
}

export interface FalRunMetaNamespace {
  museImage: FalRunMetaMuseImageNamespace;
}

export interface FalRunNamespace {
  meta: FalRunMetaNamespace;
}

export interface FalMetaMuseImageEditResponse {
  images: Array<{
    url: string;
    content_type?: string | null;
    file_name?: string | null;
    file_size?: number | null;
    width?: number | null;
    height?: number | null;
  }>;
}

type FalMetaMuseImageEditFn = ((
  params: FalMetaMuseImageEditRequest,
  signal?: AbortSignal
) => Promise<FalMetaMuseImageEditResponse>) & {
  schema: ApicitySchema<FalMetaMuseImageEditRequest>;
};

export interface FalRunMetaMuseImageNamespace {
  edit: FalMetaMuseImageEditFn;
}

export interface FalOpenaiGptImage2p5SunburstEditResponse {
  images: Array<{
    url: string;
    content_type?: string | null;
    file_name?: string | null;
    file_size?: number | null;
    width?: number | null;
    height?: number | null;
  }>;
}

type FalOpenaiGptImage2p5SunburstEditFn = ((
  params: FalOpenaiGptImage2p5SunburstEditRequest,
  signal?: AbortSignal
) => Promise<FalOpenaiGptImage2p5SunburstEditResponse>) & {
  schema: ApicitySchema<FalOpenaiGptImage2p5SunburstEditRequest>;
};

export interface FalRunOpenaiGptImage2p5SunburstNamespace {
  edit: FalOpenaiGptImage2p5SunburstEditFn;
}

export interface FalRunOpenaiGptImage2p5Namespace {
  sunburst: FalRunOpenaiGptImage2p5SunburstNamespace;
}

export interface FalRunOpenaiNamespace {
  gptImage2p5: FalRunOpenaiGptImage2p5Namespace;
}

export interface FalRunNamespace {
  openai: FalRunOpenaiNamespace;
}

export interface FalOpenaiGptImage2p5SunburstTextToImageResponse {
  images: Array<{
    url: string;
    content_type?: string | null;
    file_name?: string | null;
    file_size?: number | null;
    width?: number | null;
    height?: number | null;
  }>;
}

type FalOpenaiGptImage2p5SunburstTextToImageFn = ((
  params: FalOpenaiGptImage2p5SunburstTextToImageRequest,
  signal?: AbortSignal
) => Promise<FalOpenaiGptImage2p5SunburstTextToImageResponse>) & {
  schema: ApicitySchema<FalOpenaiGptImage2p5SunburstTextToImageRequest>;
};

export interface FalRunOpenaiGptImage2p5SunburstNamespace {
  textToImage: FalOpenaiGptImage2p5SunburstTextToImageFn;
}

export interface FalOpenaiGptImage2p5FlareEditResponse {
  images: Array<{
    url: string;
    content_type?: string | null;
    file_name?: string | null;
    file_size?: number | null;
    width?: number | null;
    height?: number | null;
  }>;
}

type FalOpenaiGptImage2p5FlareEditFn = ((
  params: FalOpenaiGptImage2p5FlareEditRequest,
  signal?: AbortSignal
) => Promise<FalOpenaiGptImage2p5FlareEditResponse>) & {
  schema: ApicitySchema<FalOpenaiGptImage2p5FlareEditRequest>;
};

export interface FalRunOpenaiGptImage2p5FlareNamespace {
  edit: FalOpenaiGptImage2p5FlareEditFn;
}

export interface FalRunOpenaiGptImage2p5Namespace {
  flare: FalRunOpenaiGptImage2p5FlareNamespace;
}

export interface FalOpenaiGptImage2p5FlareTextToImageResponse {
  images: Array<{
    url: string;
    content_type?: string | null;
    file_name?: string | null;
    file_size?: number | null;
    width?: number | null;
    height?: number | null;
  }>;
}

type FalOpenaiGptImage2p5FlareTextToImageFn = ((
  params: FalOpenaiGptImage2p5FlareTextToImageRequest,
  signal?: AbortSignal
) => Promise<FalOpenaiGptImage2p5FlareTextToImageResponse>) & {
  schema: ApicitySchema<FalOpenaiGptImage2p5FlareTextToImageRequest>;
};

export interface FalRunOpenaiGptImage2p5FlareNamespace {
  textToImage: FalOpenaiGptImage2p5FlareTextToImageFn;
}

export interface FalMicrosoftMaiImage2p5ProResponse {
  images: Array<{
    url: string;
    content_type?: string | null;
    file_name?: string | null;
    file_size?: number | null;
    width?: number | null;
    height?: number | null;
  }>;
  description: string;
}

export interface FalRunMicrosoftMaiImage2p5ProNamespace {
  (
    params: FalMicrosoftMaiImage2p5ProRequest,
    signal?: AbortSignal
  ): Promise<FalMicrosoftMaiImage2p5ProResponse>;
  schema: ApicitySchema<FalMicrosoftMaiImage2p5ProRequest>;
}

export interface FalRunMicrosoftNamespace {
  maiImage2p5Pro: FalRunMicrosoftMaiImage2p5ProNamespace;
}

export interface FalRunNamespace {
  microsoft: FalRunMicrosoftNamespace;
}

export interface FalMicrosoftMaiImage2p5ProEditResponse {
  images: Array<{
    url: string;
    content_type?: string | null;
    file_name?: string | null;
    file_size?: number | null;
    width?: number | null;
    height?: number | null;
  }>;
  description: string;
}

type FalMicrosoftMaiImage2p5ProEditFn = ((
  params: FalMicrosoftMaiImage2p5ProEditRequest,
  signal?: AbortSignal
) => Promise<FalMicrosoftMaiImage2p5ProEditResponse>) & {
  schema: ApicitySchema<FalMicrosoftMaiImage2p5ProEditRequest>;
};

export interface FalRunMicrosoftMaiImage2p5ProNamespace {
  edit: FalMicrosoftMaiImage2p5ProEditFn;
}

export interface FalNvidiaCosmos3SuperImageToVideoResponse {
  video: {
    url: string;
    content_type?: string | null;
    file_name?: string | null;
    file_size?: number | null;
    width?: number | null;
    height?: number | null;
    fps?: number | null;
    duration?: number | null;
    num_frames?: number | null;
  };
  seed: number;
}

type FalNvidiaCosmos3SuperImageToVideoFn = ((
  params: FalNvidiaCosmos3SuperImageToVideoRequest,
  signal?: AbortSignal
) => Promise<FalNvidiaCosmos3SuperImageToVideoResponse>) & {
  schema: ApicitySchema<FalNvidiaCosmos3SuperImageToVideoRequest>;
};

export interface FalRunNvidiaCosmos3SuperNamespace {
  imageToVideo: FalNvidiaCosmos3SuperImageToVideoFn;
}

export interface FalRunNvidiaNamespace {
  cosmos3Super: FalRunNvidiaCosmos3SuperNamespace;
}

export interface FalRunNamespace {
  nvidia: FalRunNvidiaNamespace;
}

export interface FalNvidiaCosmos3SuperTextToImageResponse {
  images: Array<{
    url: string;
    content_type?: string | null;
    file_name?: string | null;
    file_size?: number | null;
    width?: number | null;
    height?: number | null;
  }>;
  seed: number;
  has_nsfw_concepts: Array<boolean>;
}

type FalNvidiaCosmos3SuperTextToImageFn = ((
  params: FalNvidiaCosmos3SuperTextToImageRequest,
  signal?: AbortSignal
) => Promise<FalNvidiaCosmos3SuperTextToImageResponse>) & {
  schema: ApicitySchema<FalNvidiaCosmos3SuperTextToImageRequest>;
};

export interface FalRunNvidiaCosmos3SuperNamespace {
  textToImage: FalNvidiaCosmos3SuperTextToImageFn;
}

export interface FalLumaAgentRayV3p2ReframeResponse {
  video: {
    url: string;
    content_type?: string | null;
    file_name?: string | null;
    file_size?: number | null;
  };
  exr_file?: {
    url: string;
    content_type?: string | null;
    file_name?: string | null;
    file_size?: number | null;
  } | null;
}

type FalLumaAgentRayV3p2ReframeFn = ((
  params: FalLumaAgentRayV3p2ReframeRequest,
  signal?: AbortSignal
) => Promise<FalLumaAgentRayV3p2ReframeResponse>) & {
  schema: ApicitySchema<FalLumaAgentRayV3p2ReframeRequest>;
};

export interface FalRunLumaAgentRayV3p2Namespace {
  reframe: FalLumaAgentRayV3p2ReframeFn;
}

export interface FalRunLumaAgentRayNamespace {
  v3p2: FalRunLumaAgentRayV3p2Namespace;
}

export interface FalRunLumaAgentNamespace {
  ray: FalRunLumaAgentRayNamespace;
}

export interface FalRunLumaNamespace {
  agent: FalRunLumaAgentNamespace;
}

export interface FalRunNamespace {
  luma: FalRunLumaNamespace;
}

export interface FalLumaAgentRayV3p2VideoToVideoResponse {
  video: {
    url: string;
    content_type?: string | null;
    file_name?: string | null;
    file_size?: number | null;
  };
  exr_file?: {
    url: string;
    content_type?: string | null;
    file_name?: string | null;
    file_size?: number | null;
  } | null;
}

type FalLumaAgentRayV3p2VideoToVideoFn = ((
  params: FalLumaAgentRayV3p2VideoToVideoRequest,
  signal?: AbortSignal
) => Promise<FalLumaAgentRayV3p2VideoToVideoResponse>) & {
  schema: ApicitySchema<FalLumaAgentRayV3p2VideoToVideoRequest>;
};

export interface FalRunLumaAgentRayV3p2Namespace {
  videoToVideo: FalLumaAgentRayV3p2VideoToVideoFn;
}
