package com.olivia.backend.controller;

import com.olivia.backend.model.MillingCenter;
import com.olivia.backend.service.MillingCenterService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/milling-centers")
@CrossOrigin(origins = "*")
public class MillingCenterController {

    @Autowired
    private MillingCenterService millingCenterService;

    @GetMapping
    public List<MillingCenter> getAll() {
        return millingCenterService.getAllCenters();
    }

    @GetMapping("/{id}")
    public ResponseEntity<MillingCenter> getById(@PathVariable String id) {
        return millingCenterService.getCenterById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public MillingCenter create(@RequestBody MillingCenter center) {
        return millingCenterService.saveCenter(center);
    }

    @PutMapping("/{id}")
    public MillingCenter update(@PathVariable String id, @RequestBody MillingCenter center) {
        center.setId(id);
        return millingCenterService.saveCenter(center);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable String id) {
        millingCenterService.deleteCenter(id);
        return ResponseEntity.ok().build();
    }
}
