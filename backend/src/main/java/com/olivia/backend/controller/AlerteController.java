package com.olivia.backend.controller;

import com.olivia.backend.model.Alerte;
import com.olivia.backend.service.AlerteService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/alertes")
@CrossOrigin(origins = "*")
@PreAuthorize("hasAnyAuthority('ROLE_DIRECTEUR', 'ROLE_RESPONSABLE_LOGISTIQUE', 'ROLE_CHEF_EQUIPE_RECOLTE')")
public class AlerteController {

    @Autowired
    private AlerteService service;

    @PostMapping
    public String create(@RequestBody Alerte a) throws Exception {
        return service.create(a);
    }

    @GetMapping
    public List<Alerte> getAll() throws Exception {
        return service.getAll();
    }
}