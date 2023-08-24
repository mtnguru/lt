import VideoPanel from '../panels/VideoPanel/VideoPanel'
import MsgPanel from '../panels/MsgPanel/MsgPanel'
import {Box, Flex} from "@chakra-ui/react";

//  Video Panel
//  Msg Panel Accordion
//     Msg Pane - Chat
//
//     Down arrow, Name, PlusSign
//

// import GrafanaPanel from '../panels/GrafanaPanel/GrafanaPanel.js';

function PlayerPage() {
  return (
    <Flex id="player-page">
      <Box>
        <MsgPanel/>
      </Box>
      <Box>
        <VideoPanel />
      </Box>
    </Flex>
  )
}

export default PlayerPage;
