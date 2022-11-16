# Webapp3 packages problems

No problems using the package `@pexip/infinity`. The problems started when trying to use the `@pexip/media-components` package. We are trying to use the component: `MediaControlSettings`.

## 1. @pexip/infinity

I can see some warning in the console, but the library is working fine:

    WARNING in ./node_modules/@pexip/infinity-api/dist/call/index.js
    Module Warning (from ./node_modules/source-map-loader/dist/cjs.js):
    Failed to parse source map from '/home/mcereijo/git-repos/other/pexip-genesys-premium-app/node_modules/@pexip/infinity-api/src/call/index.ts' file: Error: ENOENT: no such file or directory, open '/home/mcereijo/git-repos/other/pexip-genesys-premium-app/node_modules/@pexip/infinity-api/src/call/index.ts'

    WARNING in ./node_modules/@pexip/infinity-api/dist/call/validation.js
    Module Warning (from ./node_modules/source-map-loader/dist/cjs.js):
    Failed to parse source map from '/home/mcereijo/git-repos/other/pexip-genesys-premium-app/node_modules/@pexip/infinity-api/src/call/validation.js' file: Error: ENOENT: no such file or directory, open '/home/mcereijo/git-repos/other/pexip-genesys-premium-app/node_modules/@pexip/infinity-api/src/call/validation.js'

    WARNING in ./node_modules/@pexip/infinity-api/dist/conference/index.js
    Module Warning (from ./node_modules/source-map-loader/dist/cjs.js):
    Failed to parse source map from '/home/mcereijo/git-repos/other/pexip-genesys-premium-app/node_modules/@pexip/infinity-api/src/conference/index.ts' file: Error: ENOENT: no such file or directory, open '/home/mcereijo/git-repos/other/pexip-genesys-premium-app/node_modules/@pexip/infinity-api/src/conference/index.ts'

    WARNING in ./node_modules/@pexip/infinity-api/dist/conference/validation.js
    Module Warning (from ./node_modules/source-map-loader/dist/cjs.js):
    Failed to parse source map from '/home/mcereijo/git-repos/other/pexip-genesys-premium-app/node_modules/@pexip/infinity-api/src/conference/validation.js' file: Error: ENOENT: no such file or directory, open '/home/mcereijo/git-repos/other/pexip-genesys-premium-app/node_modules/@pexip/infinity-api/src/conference/validation.js'

    WARNING in ./node_modules/@pexip/infinity-api/dist/errors.js
    Module Warning (from ./node_modules/source-map-loader/dist/cjs.js):
    Failed to parse source map from '/home/mcereijo/git-repos/other/pexip-genesys-premium-app/node_modules/@pexip/infinity-api/src/errors.ts' file: Error: ENOENT: no such file or directory, open '/home/mcereijo/git-repos/other/pexip-genesys-premium-app/node_modules/@pexip/infinity-api/src/errors.ts'

    WARNING in ./node_modules/@pexip/infinity-api/dist/index.js
    Module Warning (from ./node_modules/source-map-loader/dist/cjs.js):
    Failed to parse source map from '/home/mcereijo/git-repos/other/pexip-genesys-premium-app/node_modules/@pexip/infinity-api/src/index.ts' file: Error: ENOENT: no such file or directory, open '/home/mcereijo/git-repos/other/pexip-genesys-premium-app/node_modules/@pexip/infinity-api/src/index.ts'

    WARNING in ./node_modules/@pexip/infinity-api/dist/participant/index.js
    Module Warning (from ./node_modules/source-map-loader/dist/cjs.js):
    Failed to parse source map from '/home/mcereijo/git-repos/other/pexip-genesys-premium-app/node_modules/@pexip/infinity-api/src/participant/index.ts' file: Error: ENOENT: no such file or directory, open '/home/mcereijo/git-repos/other/pexip-genesys-premium-app/node_modules/@pexip/infinity-api/src/participant/index.ts'

    WARNING in ./node_modules/@pexip/infinity-api/dist/participant/validation.js
    Module Warning (from ./node_modules/source-map-loader/dist/cjs.js):
    Failed to parse source map from '/home/mcereijo/git-repos/other/pexip-genesys-premium-app/node_modules/@pexip/infinity-api/src/participant/validation.js' file: Error: ENOENT: no such file or directory, open '/home/mcereijo/git-repos/other/pexip-genesys-premium-app/node_modules/@pexip/infinity-api/src/participant/validation.js'

    WARNING in ./node_modules/@pexip/infinity-api/dist/token/index.js
    Module Warning (from ./node_modules/source-map-loader/dist/cjs.js):
    Failed to parse source map from '/home/mcereijo/git-repos/other/pexip-genesys-premium-app/node_modules/@pexip/infinity-api/src/token/index.ts' file: Error: ENOENT: no such file or directory, open '/home/mcereijo/git-repos/other/pexip-genesys-premium-app/node_modules/@pexip/infinity-api/src/token/index.ts'

    WARNING in ./node_modules/@pexip/infinity-api/dist/token/validation.js
    Module Warning (from ./node_modules/source-map-loader/dist/cjs.js):
    Failed to parse source map from '/home/mcereijo/git-repos/other/pexip-genesys-premium-app/node_modules/@pexip/infinity-api/src/token/validation.js' file: Error: ENOENT: no such file or directory, open '/home/mcereijo/git-repos/other/pexip-genesys-premium-app/node_modules/@pexip/infinity-api/src/token/validation.js'

    WARNING in ./node_modules/@pexip/infinity-api/dist/utils.js
    Module Warning (from ./node_modules/source-map-loader/dist/cjs.js):
    Failed to parse source map from '/home/mcereijo/git-repos/other/pexip-genesys-premium-app/node_modules/@pexip/infinity-api/src/utils.ts' file: Error: ENOENT: no such file or directory, open '/home/mcereijo/git-repos/other/pexip-genesys-premium-app/node_modules/@pexip/infinity-api/src/utils.ts'

## 2. @pexip/media-components

### 2.1. TestIds not found

When I try to run the app, I find a lot of messages with the following structure:

    ERROR in node_modules/@pexip/media-components/src/views/VideoStatus/VideoStatus.view.tsx:7:22
    TS2307: Cannot find module '../../../test/testIds' or its corresponding type declarations.
        5 | import {Text, TextHeading} from '@pexip/components';
        6 |
      >  7 | import {TestId} from '../../../test/testIds';
          |                      ^^^^^^^^^^^^^^^^^^^^^^^
        8 |
        9 | import styles from './VideoStatus.module.scss';
        10 |

As a workaround, I created a file in `node_modules/@pexip/media-components/test/testIds.ts` with the following content:

```typescript
export enum TestId {
    AudioMeterSettings = 'audio-meter-settings',
    BadgeCounterParticipantPanelButton = 'badge-counter-participant-panel-button',
    ButtonAdmitParticipant = 'button-admit-participant',
    ButtonAudioMeter = 'button-audio-meter',
    ButtonAudioMeterMuted = 'button-audio-meter-muted',
    ButtonBackgroundEffectsOff = 'button-background-effects-off',
    ButtonBackgroundEffectsOn = 'button-background-effects-on',
    ButtonChat = 'button-chat',
    ButtonChatSend = 'button-chat-send',
    ButtonCloseInvitationModal = 'button-invitation-modal',
    ButtonCollapseSelfview = 'button-collapse-selfview',
    ButtonCopyMeetingLink = 'button-copy-meeting-link',
    ButtonDenyParticipant = 'button-deny-participant',
    ButtonDeviceSettings = 'button-device-settings',
    ButtonDismiss = 'button-dismiss',
    ButtonDragFoldedSelfview = 'button-drag-folded-selfview',
    ButtonExpandSelfview = 'button-hide-selfview',
    ButtonFlipCamera = 'button-flip-camera',
    ButtonInviteMemberSearchRow = 'button-invite-member-search-row',
    ButtonKickOffParticipant = 'button-kick-off-participant',
    ButtonMeetingAudioInput = 'button-meeting-audioinput',
    ButtonMeetingAudioInputMuted = 'button-meeting-audioinput-muted',
    ButtonMeetingBackgroundEffectsOff = 'button-meeting-background-effects-off',
    ButtonMeetingBackgroundEffectsOn = 'button-meeting-background-effects-on',
    ButtonMeetingVideoInput = 'button-meeting-videoinput',
    ButtonMeetingVideoInputMuted = 'button-meeting-videoinput-muted',
    ButtonMuteParticipant = 'button-mute-participant',
    ButtonParticipants = 'button-participants',
    ButtonPeerMuted = 'button-peer-muted',
    ButtonPeerMutedCamera = 'button-peer-muted-camera',
    ButtonPeerPresenting = 'button-peer-presenting',
    ButtonPeerUnmuteCamera = 'button-peer-unmute-camera',
    ButtonQuality = 'button-quality',
    ButtonRemoveUserCancel = 'button-remove-user-cancel',
    ButtonRemoveUserConfirm = 'button-remove-user-confirm',
    ButtonRequestPermissions = 'button-request-permissions',
    ButtonSelfviewQuality = 'button-selfview-quality',
    ButtonSettingsCancel = 'button-settings-cancel',
    ButtonSettingsSave = 'button-settings-save',
    ButtonStartPresentation = 'button-start-presentation',
    ButtonStealPresentationCancel = 'button-steal-presentation-cancel',
    ButtonStealPresentationConfirm = 'button-steal-presentation-confirm',
    ButtonStopPresentation = 'button-stop-presentation',
    ButtonTestAudioInputAgain = 'button-test-audio-input-again',
    ButtonTestAudioInputStart = 'button-test-audio-input-start',
    ButtonTestAudioInputTryAgain = 'button-test-audio-input-try-again',
    ButtonToggleAudioSelfview = 'button-toggle-audio-in-folded-selfview',
    ButtonToggleVideoSelfview = 'button-toggle-video-in-folded-selfview',
    ButtonTryAgain = 'button-try-again',
    ButtonVideoInput = 'button-videoinput',
    ButtonVideoinputMuted = 'button-videoinput-muted',
    ChatActivityMessage = 'chat-activity-message',
    ChatActivityMessageDisplayName = 'chat-activity-message-display-name',
    ChatActivityMessageText = 'chat-activity-message-text',
    ChatEmptyActivityMessage = 'chat-empty-activity-message',
    ChatForm = 'chat-form',
    ChatInput = 'chat-input',
    ChatMessage = 'chat-message',
    ChatMessageLink = 'chat-message-link',
    ChatMessageName = 'chat-message-name',
    ChatMessages = 'chat-messages',
    ChatMessageText = 'chat-message-text',
    ChatPanel = 'chat-panel',
    ChatRemoveActivityMessage = 'chat-remove-activity-message',
    CheckEverythingWorksText = 'check-that-everything-works',
    ConfirmationModalCancelButton = 'confirmation-modal-cancel-button',
    ConfirmationModalConfirmButton = 'confirmation-modal-confirm-button',
    DevicesSelection = 'devices-selection',
    DevicesSelectionBlocked = 'devices-selection-blocked',
    FoldedSelfview = 'folded-selfview',
    HeaderLogo = 'header-logo',
    HeaderSubTitle = 'header-subtitle',
    HeaderTitle = 'header-title',
    InvitationSearchInput = 'invitation-search-input',
    JoinCallDetailsWrapper = 'join-call-details-wrapper',
    LinkMuteAllGuests = 'link-mute-all-guests',
    LinkOpenMeetingSettings = 'link-open-meeting-settings',
    LinkTestAudioInput = 'link-test-audio-input',
    LinkTestAudioOutput = 'link-test-audio-output',
    LinkUnmuteAllGuests = 'link-unmute-all-guests',
    MeetingLinkText = 'meeting-link-text',
    MeetingVideoFull = 'meeting-video-large',
    MeetingVideoPip = 'meeting-video-pip',
    MeetingWrapper = 'meeting-wrapper',
    MissingAudioDeviceAlert = 'missing-audio-device-alert',
    MissingVideoDeviceAlert = 'missing-video-device-alert',
    ModalInvitation = 'modal-invitation',
    ModalLayoutChangeConfirmation = 'modal-layout-change-confirmation',
    ModalRemoveUser = 'modal-remove-user',
    ModalStealPresentation = 'modal-steal-presentation',
    NetworkConnectedState = 'network-connected-state',
    NetworkReconnectedState = 'network-reconnected-state',
    NetworkReconnectingState = 'network-reconnecting-state',
    NotificationToolTipAudioCloseButton = 'notification-tooltip-audio-close-button',
    NotificationToolTipAudioProblem = 'notification-tooltip-audio-problem',
    NotificationToolTipDeviceError = 'notification-tooltip-device-error',
    NotificationTooltipPreviouslyBlocked = 'notification-tooltip-previously-blocked',
    NotificationTooltipSelfviewHidden = 'notification-tooltip-selfview-hidden',
    NotificationToolTipVideoCloseButton = 'notification-tooltip-video-close-button',
    NotificationToolTipVideoProblem = 'notification-tooltip-video-problem',
    ParticipantPanel = 'participant-panel',
    ParticipantRow = 'participant-row',
    PermissionsRequestMessageWrapper = 'permissions-request-message-wrapper',
    PillNewChatMessage = 'new-chat-message-pill',
    PresentationFull = 'presentation-large',
    PresentationPip = 'presentation-pip',
    SearchRow = 'search-row',
    SelectAudioInput = 'select-audio-input',
    SelectAudioInputErrorText = 'select-audio-input-error-text',
    SelectAudioOutput = 'select-audio-output',
    SelectTestAudioInput = 'select-test-audio-input',
    SelectTestAudioInputPlayback = 'select-test-audio-input-playback',
    SelectTestAudioInputSpeakerPlayback = 'select-test-audio-input-speaker-playback',
    SelectVideoInput = 'select-video-input',
    SelectVideoInputErrorText = 'select-video-input-error-text',
    SettingsVideoSelfview = 'settings-video-selfview',
    SpeakingIndicator = 'speaking-indicator',
    TestAudioInputIndicator = 'test-audio-input-indicator',
    TextLinkLearnDismissRequestPermissions = 'text-link-dismiss-learn-request-permissions',
    TextLinkLearnRequestPermissions = 'text-link-learn-request-permissions',
    TextLinkTryAgainRequestPermissions = 'text-link-try-again-request-permissions',
    TextLinkUnblockPermissionsVideo = 'text-link-unblock-permissions-video',
    ToastYouAreTemporarilyUnmuted = 'toast-you-are-temporarily-unmuted',
    ToggleNoiseSuppression = 'toggle-noise-suppression',
    TooltipDeniedDevice = 'tooltip-denied-device',
    VideoMeeting = 'video-meeting',
    VideoPresentation = 'video-presentation',
    VideoSelfview = 'video-selfview',
    VideoSelfviewWrapper = 'video-selfview-wrapper',
    VideoStatus = 'video-status',
    VideoStatusBody = 'video-status-body',
    VideoStatusTitle = 'video-status-title',
}
```
### 2.2. uuid package not found

useFocusTrap as a dependency that is not downloaded automatically:

```
ERROR in node_modules/@pexip/components/src/components/modules/Focus/useFocusTrap.tsx:4:26
TS2307: Cannot find module 'uuid' or its corresponding type declarations.
  2 | import {isFocusable, tabbable} from 'tabbable';
  3 | import type {FocusableElement} from 'tabbable';
> 4 | import {v4 as uuid} from 'uuid';
    |                          ^^^^^^
  5 |
  6 | const manager = (() => {
  7 |     const data: string[] = [];
```
```
ERROR in node_modules/@pexip/media-components/src/utils/buildActivityGroupMessage.ts:1:26
TS2307: Cannot find module 'uuid' or its corresponding type declarations.
  > 1 | import {v4 as uuid} from 'uuid';
      |                          ^^^^^^
    2 |
    3 | import type {
    4 |     ChatActivityType,
```

The workaround for this problem is to install the typings yourself:

    npm i @types/uuid

### 2.3. pexDebug doesn't exist in window

We get the following error

      ERROR in node_modules/@pexip/media-components/src/hooks/useCallQuality.ts:32:43
      TS2339: Property 'pexDebug' does not exist on type 'Window & typeof globalThis'.
          30 |                             outgoingQuality,
          31 |                             streamQuality,
        > 32 |                             stats: window.pexDebug?.stats,
            |                                           ^^^^^^^^
          33 |                         },
          34 |                         'Call quality changed',
          35 |                     );

Change the line 32 in `node_modules/@pexip/media-components/src/hooks/useCallQuality.ts` to:

    stats: (window as any).pexDebug?.stats,

### 2.4. Array iterated

    ERROR in node_modules/@pexip/media-components/src/hooks/useAudioMeter.ts:20:24
    TS2802: Type 'Uint8Array' can only be iterated through when using the '--downlevelIteration' flag or with a '--target' of 'es2015' or higher.
        18 |
        19 |     analyzer.node.getByteFrequencyData(buffer);
      > 20 |     return Math.max(...buffer);
          |                        ^^^^^^
        21 | };
        22 |
        23 | /**

As a workaround, you can increase the target version from `es5` to `es6` and add `downlevelIteration` in you `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "es6",
    "downlevelIteration": true,
    ...
```

### 2.5. Component properties doesn't match

I receive the following error:

```
ERROR in node_modules/@pexip/components/src/components/modules/TransitionContainer/withTransition.tsx:22:17
TS2322: Type 'P' is not assignable to type 'IntrinsicAttributes & P'.
  Type 'P' is not assignable to type 'IntrinsicAttributes'.
    20 |         }
    21 |
  > 22 |         return <Component {...(restProps as P)} />;
       |                 ^^^^^^^^^
    23 |     };
    24 | }
    25 |
```

```
ERROR in node_modules/@pexip/components/src/themes/ThemeContext.tsx:31:18
TS2322: Type 'P' is not assignable to type 'IntrinsicAttributes & P'.
  Type 'P' is not assignable to type 'IntrinsicAttributes'.
    29 |         return (
    30 |             <ThemeProvider colorScheme={colorScheme}>
  > 31 |                 <Component {...props} />
       |                  ^^^^^^^^^
    32 |             </ThemeProvider>
    33 |         );
    34 |     };
```

Edit the files `node_modules/@pexip/components/src/components/modules/TransitionContainer/withTransition.tsx` and `node_modules/@pexip/components/src/themes/ThemeContext.tsx` with the following:

* Change the props return type:

```typescript
<Component {...(props as any)} />
```

* Change the props return type:

```typescript
<Component {...(props as any)} />
```

Ideally with some choose the correct type.

# 2.6 Tensor flow

    ERROR in ./node_modules/@pexip/media-processor/dist/index.mjs 1114:0-66
    Module not found: Error: Can't resolve '@tensorflow/tfjs-core/dist/base' in '/home/mcereijo/git-repos/other/pexip-genesys-premium-app/node_modules/@pexip/media-processor/dist'
    Did you mean 'base.js'?
    BREAKING CHANGE: The request '@tensorflow/tfjs-core/dist/base' failed to resolve only because it was resolved as fully specified
    (probably because the origin is strict EcmaScript Module, e. g. a module with javascript mimetype, a '*.mjs' file, or a '*.js' file where the package.json contains '"type": "module"').
    The extension in the request is mandatory for it to be fully specified.
    Add the extension to the request.

Edit the file `@pexip/media-processor/dist/index.mjs` and add the extension of the `base.js` file:

```javascript
// src/video/utils.ts
import { Tensor, browser } from "@tensorflow/tfjs-core/dist/base.js";

```

```javascript
// src/video/canvasRenderUtils.ts
import { Tensor as Tensor2, browser as browser2 } from "@tensorflow/tfjs-core/dist/base.js";

```