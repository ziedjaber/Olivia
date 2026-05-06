package com.olivia.backend.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class User {
    private String id;
    private String email;
    private String password;
    private String fullName;
    private Role role;
    private String avatarUrl;
    private boolean active;
}