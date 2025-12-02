package com.bagga.aiserver.dtos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.web.multipart.MultipartFile;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateMessageDto {
    private String message;
    private String fileName;
    private String fileContent;
    private String senderId;
    private String recipientId;
}
